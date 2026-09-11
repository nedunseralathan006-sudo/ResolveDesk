import express from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateAssignment } from '../middleware/validate.js';
import { enrichComplaintWithSla } from '../services/sla.js';

const router = express.Router();
router.use(authenticate);

// POST /api/complaints/:id/assign
router.post('/:id/assign', authorize('manager'), validateAssignment, (req, res) => {
  try {
    const db = getDb();
    const { agent_id, notes } = req.body;
    const ticketId = req.params.id;

    const agent = db.prepare("SELECT id, full_name FROM users WHERE id = ? AND role = 'agent'").get(Number(agent_id));
    if (!agent) return res.status(400).json({ error: 'Invalid agent. Please select a valid support agent.' });

    const complaint = db.prepare('SELECT * FROM complaints WHERE ticket_id = ?').get(ticketId);
    if (!complaint) return res.status(404).json({ error: `Ticket ${ticketId} not found.` });

    if (complaint.status === 'resolved' || complaint.status === 'closed') {
      return res.status(400).json({ error: `Cannot assign a ${complaint.status} ticket.` });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newStatus = complaint.status === 'new' ? 'assigned' : complaint.status;

    db.transaction(() => {
      db.prepare(`
        UPDATE complaints
        SET assigned_agent_id = ?, assigned_at = ?, status = ?, updated_at = ?
        WHERE id = ?
      `).run(Number(agent_id), now, newStatus, now, complaint.id);

      db.prepare(`
        INSERT INTO assignment_history (complaint_id, agent_id, assigned_by, notes, assigned_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(complaint.id, Number(agent_id), req.user.id, notes || '', now);

      if (complaint.status === 'new') {
        db.prepare(`
          INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, reason, changed_at)
          VALUES (?, 'new', 'assigned', ?, ?, ?)
        `).run(complaint.id, req.user.id, `Assigned to ${agent.full_name}`, now);
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
    console.error('POST /assign error:', error);
    res.status(500).json({ error: 'Failed to assign ticket. Please try again.' });
  }
});

// GET /api/complaints/:id/assignment-history
router.get('/:id/assignment-history', authorize('manager'), (req, res) => {
  try {
    const db = getDb();
    const ticketId = req.params.id;

    const complaint = db.prepare('SELECT id FROM complaints WHERE ticket_id = ?').get(ticketId);
    if (!complaint) return res.status(404).json({ error: `Ticket ${ticketId} not found.` });

    const history = db.prepare(`
      SELECT ah.*, ag.full_name as agent_name, assigner.full_name as assigned_by_name
      FROM assignment_history ah
      JOIN users ag ON ah.agent_id = ag.id
      JOIN users assigner ON ah.assigned_by = assigner.id
      WHERE ah.complaint_id = ?
      ORDER BY ah.assigned_at ASC
    `).all(complaint.id);

    res.json(history);
  } catch (error) {
    console.error('GET /assignment-history error:', error);
    res.status(500).json({ error: 'Failed to load assignment history.' });
  }
});

export default router;
