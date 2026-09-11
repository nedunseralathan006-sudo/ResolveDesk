import express from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { autoEscalateOverdue, getSlaStatus, enrichComplaintWithSla } from '../services/sla.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('manager'));

router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    if (autoEscalateOverdue(db) > 0) saveDb();
    
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM complaints').get();
    const performance = db.prepare(`
      SELECT
        ROUND(AVG(CASE WHEN resolved_at IS NOT NULL
          THEN (julianday(resolved_at) - julianday(created_at)) * 24 END), 2) as average_resolution_hours,
        ROUND(AVG(f.rating), 2) as average_rating,
        COUNT(f.id) as feedback_count
      FROM complaints c
      LEFT JOIN feedback f ON f.complaint_id = c.id
    `).get();
    
    const byStatusRows = db.prepare('SELECT status, COUNT(*) as count FROM complaints GROUP BY status').all();
    const by_status = { new: 0, assigned: 0, in_progress: 0, escalated: 0, resolved: 0, closed: 0 };
    for (const row of byStatusRows) {
      if (by_status[row.status] !== undefined) {
        by_status[row.status] = row.count;
      }
    }

    const activeComplaints = db.prepare(`
      SELECT * FROM complaints WHERE status NOT IN ('resolved', 'closed')
    `).all();

    let sla_breached = 0;
    let sla_at_risk = 0;

    for (const c of activeComplaints) {
      const status = getSlaStatus(c);
      if (status === 'breached') sla_breached++;
      else if (status === 'at_risk') sla_at_risk++;
    }

    res.json({
      total: totalRow.count,
      by_status,
      sla_breached,
      sla_at_risk,
      average_resolution_hours: performance.average_resolution_hours || 0,
      average_rating: performance.average_rating || 0,
      feedback_count: performance.feedback_count || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/urgent', (req, res) => {
  try {
    const db = getDb();
    if (autoEscalateOverdue(db) > 0) saveDb();
    const activeComplaints = db.prepare(`
      SELECT c.*, cat.name as category_name, ag.full_name as agent_name
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users ag ON c.assigned_agent_id = ag.id
      WHERE c.status NOT IN ('resolved', 'closed')
    `).all();

    const breached = [];
    const at_risk = [];

    for (const c of activeComplaints) {
      const enriched = enrichComplaintWithSla(c);
      if (enriched.sla_status === 'breached') {
        breached.push(enriched);
      } else if (enriched.sla_status === 'at_risk') {
        at_risk.push(enriched);
      }
    }

    const sortByDeadline = (a, b) => new Date(a.sla_deadline) - new Date(b.sla_deadline);
    breached.sort(sortByDeadline);
    at_risk.sort(sortByDeadline);

    res.json({ breached, at_risk });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/agents', (req, res) => {
  try {
    const db = getDb();
    const agents = db.prepare(`
      SELECT id, full_name, email FROM users WHERE role = 'agent'
    `).all();

    const counts = db.prepare(`
      SELECT assigned_agent_id, COUNT(*) as count 
      FROM complaints 
      WHERE status NOT IN ('resolved', 'closed') AND assigned_agent_id IS NOT NULL
      GROUP BY assigned_agent_id
    `).all();

    const countMap = {};
    for (const row of counts) {
      countMap[row.assigned_agent_id] = row.count;
    }

    const result = agents.map(ag => ({
      ...ag,
      active_complaints_count: countMap[ag.id] || 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/feedback', (req, res) => {
  try {
    const db = getDb();
    const feedbackList = db.prepare(`
      SELECT f.*, c.ticket_id, c.subject, u.full_name as customer_name,
             r.description as resolution_description, r.resolved_at
      FROM feedback f
      JOIN complaints c ON f.complaint_id = c.id
      JOIN users u ON f.customer_id = u.id
      LEFT JOIN resolutions r ON r.complaint_id = c.id
      ORDER BY f.submitted_at DESC
    `).all();

    res.json(feedbackList);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports', (req, res) => {
  try {
    const db = getDb();
    const grouped = (column) => db.prepare(`
      SELECT ${column} as label, COUNT(*) as count
      FROM complaints GROUP BY ${column} ORDER BY count DESC
    `).all();
    const categories = db.prepare(`
      SELECT cat.name as label, COUNT(c.id) as count
      FROM complaints c JOIN categories cat ON c.category_id = cat.id
      GROUP BY cat.id ORDER BY count DESC
    `).all();
    const monthly = db.prepare(`
      SELECT substr(created_at, 1, 7) as label, COUNT(*) as count
      FROM complaints GROUP BY substr(created_at, 1, 7) ORDER BY label ASC
    `).all();
    res.json({ priority: grouped('priority'), channel: grouped('channel'), status: grouped('status'), categories, monthly });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load reports.' });
  }
});

export default router;
