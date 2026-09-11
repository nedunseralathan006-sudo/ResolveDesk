import express from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateComplaint, validateStatusUpdate } from '../middleware/validate.js';
import { autoEscalateOverdue, calculateSlaDeadline, enrichComplaintWithSla, getSlaHours } from '../services/sla.js';
import { generateTicketId } from '../services/ticket.js';

const router = express.Router();
router.use(authenticate);

// GET /api/complaints
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status, priority, category_id, assignee, sla_status, search, created_from, created_to } = req.query;
    if (autoEscalateOverdue(db) > 0) saveDb();

    let query = `
      SELECT c.*, cat.name as category_name,
             cu.full_name as customer_name,
             ag.full_name as agent_name
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      JOIN users cu ON c.customer_id = cu.id
      LEFT JOIN users ag ON c.assigned_agent_id = ag.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'customer') {
      query += ` AND c.customer_id = ?`;
      params.push(req.user.id);
    } else if (req.user.role === 'agent') {
      query += ` AND c.assigned_agent_id = ?`;
      params.push(req.user.id);
    }

    if (status) { query += ` AND c.status = ?`; params.push(status); }
    if (priority) { query += ` AND c.priority = ?`; params.push(priority); }
    if (category_id) { query += ` AND c.category_id = ?`; params.push(Number(category_id)); }
    if (assignee) { query += ` AND c.assigned_agent_id = ?`; params.push(Number(assignee)); }
    if (search) {
      query += ` AND (c.ticket_id LIKE ? OR c.subject LIKE ? OR cat.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (created_from) { query += ` AND date(c.created_at) >= date(?)`; params.push(created_from); }
    if (created_to) { query += ` AND date(c.created_at) <= date(?)`; params.push(created_to); }

    query += ` ORDER BY c.created_at DESC`;

    const complaints = db.prepare(query).all(...params);
    let enriched = complaints.map(enrichComplaintWithSla);

    if (sla_status) {
      enriched = enriched.filter(c => c.sla_status === sla_status);
    }

    res.json(enriched);
  } catch (error) {
    console.error('GET /complaints error:', error);
    res.status(500).json({ error: 'Failed to load complaints. Please try again.' });
  }
});

// GET /api/complaints/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    if (autoEscalateOverdue(db) > 0) saveDb();
    const ticketId = req.params.id;

    const complaint = db.prepare(`
      SELECT c.*,
             cat.name as category_name,
             cu.full_name as customer_name,
             cu.email as customer_email,
             cu.phone as customer_phone,
             ag.full_name as agent_name
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      JOIN users cu ON c.customer_id = cu.id
      LEFT JOIN users ag ON c.assigned_agent_id = ag.id
      WHERE c.ticket_id = ?
    `).get(ticketId);

    if (!complaint) return res.status(404).json({ error: `Ticket ${ticketId} not found.` });

    if (req.user.role === 'customer' && complaint.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to view this ticket.' });
    }
    if (req.user.role === 'agent' && complaint.assigned_agent_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this ticket.' });
    }

    const enriched = enrichComplaintWithSla(complaint);

    enriched.status_history = db.prepare(`
      SELECT sh.*, u.full_name as changed_by_name
      FROM status_history sh
      JOIN users u ON sh.changed_by = u.id
      WHERE sh.complaint_id = ?
      ORDER BY sh.changed_at ASC
    `).all(complaint.id);

    enriched.assignment_history = db.prepare(`
      SELECT ah.*, ag.full_name as agent_name, assigner.full_name as assigned_by_name
      FROM assignment_history ah
      JOIN users ag ON ah.agent_id = ag.id
      JOIN users assigner ON ah.assigned_by = assigner.id
      WHERE ah.complaint_id = ?
      ORDER BY ah.assigned_at ASC
    `).all(complaint.id);

    enriched.escalations = db.prepare(`
      SELECT e.*, u.full_name as escalated_by_name
      FROM escalations e
      JOIN users u ON e.escalated_by = u.id
      WHERE e.complaint_id = ?
      ORDER BY e.escalated_at ASC
    `).all(complaint.id);

    enriched.resolutions = db.prepare(`
      SELECT r.*, u.full_name as resolved_by_name
      FROM resolutions r
      JOIN users u ON r.resolved_by = u.id
      WHERE r.complaint_id = ?
      ORDER BY r.resolved_at ASC
    `).all(complaint.id);

    enriched.feedback = db.prepare(`
      SELECT f.*, u.full_name as customer_name
      FROM feedback f
      JOIN users u ON f.customer_id = u.id
      WHERE f.complaint_id = ?
    `).get(complaint.id) || null;

    res.json(enriched);
  } catch (error) {
    console.error('GET /complaints/:id error:', error);
    res.status(500).json({ error: 'Failed to load ticket. Please try again.' });
  }
});

// POST /api/complaints
router.post('/', authorize('customer'), validateComplaint, (req, res) => {
  try {
    const db = getDb();
    const { category_id, subject, description, priority, channel } = req.body;

    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(Number(category_id));
    if (!category) return res.status(400).json({ error: 'Invalid category. Please select a valid category.' });

    const ticket_id = generateTicketId(db);
    const customerId = req.user.id;
    const created_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const sla_hours = getSlaHours(priority);
    const sla_deadline = calculateSlaDeadline(created_at, priority);

    let newId;
    db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO complaints
          (ticket_id, customer_id, category_id, subject, description, priority, channel,
           status, sla_hours, sla_deadline, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)
      `).run(ticket_id, customerId, Number(category_id), subject, description,
             priority, channel, sla_hours, sla_deadline, created_at, created_at);

      newId = result.lastInsertRowid;

      db.prepare(`
        INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, reason, changed_at)
        VALUES (?, NULL, 'new', ?, 'Complaint registered', ?)
      `).run(newId, customerId, created_at);
    })();

    saveDb();

    const newComplaint = db.prepare(`
      SELECT c.*, cat.name as category_name,
             cu.full_name as customer_name,
             cu.email as customer_email
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      JOIN users cu ON c.customer_id = cu.id
      WHERE c.ticket_id = ?
    `).get(ticket_id);

    res.status(201).json(enrichComplaintWithSla(newComplaint));
  } catch (error) {
    console.error('POST /complaints error:', error);
    res.status(500).json({ error: 'Failed to register complaint. Please try again.' });
  }
});

// PATCH /api/complaints/:id/status
router.patch('/:id/status', validateStatusUpdate, (req, res) => {
  try {
    const db = getDb();
    const { status, reason, resolution_description } = req.body;
    const ticketId = req.params.id;

    const complaint = db.prepare('SELECT * FROM complaints WHERE ticket_id = ?').get(ticketId);
    if (!complaint) return res.status(404).json({ error: `Ticket ${ticketId} not found.` });

    if (req.user.role === 'customer') {
      return res.status(403).json({ error: 'Customers cannot update ticket status.' });
    }
    if (req.user.role === 'agent' && complaint.assigned_agent_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this ticket.' });
    }

    const current = complaint.status;

    // Define valid transitions per role
    const agentTransitions = {
      assigned:    ['in_progress'],
      escalated:   ['in_progress'],
      in_progress: ['resolved'],
    };
    const managerTransitions = {
      new:         ['assigned'],
      assigned:    ['in_progress'],
      in_progress: ['escalated', 'resolved'],
      escalated:   ['in_progress', 'resolved'],
      resolved:    ['closed', 'in_progress'],
      closed:      [],
    };

    const allowed = req.user.role === 'agent'
      ? (agentTransitions[current] || [])
      : (managerTransitions[current] || []);

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot change status from "${current}" to "${status}". Invalid transition.`
      });
    }

    if (status === 'resolved') {
      if (!resolution_description || resolution_description.trim().length < 10) {
        return res.status(400).json({ error: 'A resolution description of at least 10 characters is required.' });
      }
    }
    if (current === 'resolved' && status === 'in_progress') {
      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({ error: 'A reason is required to reopen this ticket.' });
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.transaction(() => {
      let sets = ['status = ?', 'updated_at = ?'];
      const params = [status, now];

      if (status === 'resolved') { sets.push('resolved_at = ?'); params.push(now); }
      if (status === 'closed') { sets.push('closed_at = ?'); params.push(now); }
      // Clear resolved_at when reopening
      if (status === 'in_progress' && current === 'resolved') {
        sets.push('resolved_at = NULL');
      }

      params.push(complaint.id);
      db.prepare(`UPDATE complaints SET ${sets.join(', ')} WHERE id = ?`).run(...params);

      db.prepare(`
        INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, reason, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(complaint.id, current, status, req.user.id, reason || '', now);

      if (status === 'resolved') {
        db.prepare(`
          INSERT INTO resolutions (complaint_id, resolved_by, description, resolved_at)
          VALUES (?, ?, ?, ?)
        `).run(complaint.id, req.user.id, resolution_description.trim(), now);
      }
    })();

    saveDb();

    const updated = db.prepare(`
      SELECT c.*, cat.name as category_name,
             cu.full_name as customer_name,
             ag.full_name as agent_name
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      JOIN users cu ON c.customer_id = cu.id
      LEFT JOIN users ag ON c.assigned_agent_id = ag.id
      WHERE c.id = ?
    `).get(complaint.id);

    res.json(enrichComplaintWithSla(updated));
  } catch (error) {
    console.error('PATCH /complaints/:id/status error:', error);
    res.status(500).json({ error: 'Failed to update status. Please try again.' });
  }
});

export default router;
