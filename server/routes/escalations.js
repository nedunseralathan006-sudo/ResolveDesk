import express from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateEscalation } from '../middleware/validate.js';
import { enrichComplaintWithSla } from '../services/sla.js';

const router = express.Router();
router.use(authenticate);

// POST /api/complaints/:id/escalate
router.post('/:id/escalate', authorize('manager'), validateEscalation, (req, res) => {
  try {
    const db = getDb();
    const { reason } = req.body;
    const ticketId = req.params.id;

    const complaint = db.prepare('SELECT * FROM complaints WHERE ticket_id = ?').get(ticketId);
    if (!complaint) return res.status(404).json({ error: `Ticket ${ticketId} not found.` });

    const escalatableStatuses = ['assigned', 'in_progress', 'escalated'];
    if (!escalatableStatuses.includes(complaint.status)) {
      return res.status(400).json({
        error: `Cannot escalate a ticket with status "${complaint.status}". Ticket must be assigned or in progress.`
      });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.transaction(() => {
      db.prepare(`
        UPDATE complaints SET status = 'escalated', updated_at = ? WHERE id = ?
      `).run(now, complaint.id);

      db.prepare(`
        INSERT INTO escalations (complaint_id, escalated_by, reason, escalated_at)
        VALUES (?, ?, ?, ?)
      `).run(complaint.id, req.user.id, reason.trim(), now);

      db.prepare(`
        INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, reason, changed_at)
        VALUES (?, ?, 'escalated', ?, ?, ?)
      `).run(complaint.id, complaint.status, req.user.id, reason.trim(), now);
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
    console.error('POST /escalate error:', error);
    res.status(500).json({ error: 'Failed to escalate ticket. Please try again.' });
  }
});

export default router;
