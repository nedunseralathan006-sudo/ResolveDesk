import express from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateFeedback } from '../middleware/validate.js';

const router = express.Router();
router.use(authenticate);

// POST /api/complaints/:id/feedback
router.post('/:id/feedback', authorize('customer'), validateFeedback, (req, res) => {
  try {
    const db = getDb();
    const { rating, comment } = req.body;
    const ticketId = req.params.id;

    const complaint = db.prepare('SELECT * FROM complaints WHERE ticket_id = ?').get(ticketId);
    if (!complaint) return res.status(404).json({ error: `Ticket ${ticketId} not found.` });

    if (complaint.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only provide feedback on your own complaints.' });
    }

    if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
      return res.status(400).json({
        error: 'Feedback can only be submitted for resolved tickets. Please wait for your complaint to be resolved.'
      });
    }

    const existingFeedback = db.prepare('SELECT id FROM feedback WHERE complaint_id = ?').get(complaint.id);
    if (existingFeedback) {
      return res.status(409).json({ error: 'Feedback has already been submitted for this complaint.' });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.transaction(() => {
      db.prepare(`
        INSERT INTO feedback (complaint_id, customer_id, rating, comment, submitted_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(complaint.id, req.user.id, ratingNum, comment || '', now);

      if (complaint.status === 'resolved') {
        db.prepare(`
          UPDATE complaints SET status = 'closed', closed_at = ?, updated_at = ? WHERE id = ?
        `).run(now, now, complaint.id);

        db.prepare(`
          INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, reason, changed_at)
          VALUES (?, 'resolved', 'closed', ?, 'Customer feedback received', ?)
        `).run(complaint.id, req.user.id, now);
      }
    })();

    saveDb();

    const newFeedback = db.prepare('SELECT * FROM feedback WHERE complaint_id = ?').get(complaint.id);
    res.status(201).json(newFeedback);
  } catch (error) {
    console.error('POST /feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  }
});

export default router;
