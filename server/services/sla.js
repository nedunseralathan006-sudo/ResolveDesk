export const SLA_HOURS = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 48
};

export const getSlaHours = (priority) => {
  return SLA_HOURS[priority] || SLA_HOURS.medium;
};

export const calculateSlaDeadline = (createdAt, priority) => {
  const hours = getSlaHours(priority);
  const date = new Date(createdAt);
  date.setHours(date.getHours() + hours);
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

export const getSlaStatus = (complaint) => {
  const { sla_deadline, sla_hours, status, resolved_at } = complaint;

  if (!sla_deadline) return 'unknown';

  const deadlineMs = new Date(sla_deadline.replace(' ', 'T') + 'Z').getTime();
  const nowMs = Date.now();
  
  if (status === 'resolved' || status === 'closed') {
    const resolvedMs = new Date(resolved_at.replace(' ', 'T') + 'Z').getTime();
    if (resolvedMs > deadlineMs) {
      return 'breached';
    }
    return 'within_sla';
  }

  if (nowMs > deadlineMs) {
    return 'breached';
  }

  const riskThresholdMs = deadlineMs - (sla_hours * 60 * 60 * 1000 * 0.25);
  if (nowMs > riskThresholdMs) {
    return 'at_risk';
  }

  return 'within_sla';
};

export const enrichComplaintWithSla = (complaint) => {
  return {
    ...complaint,
    sla_status: getSlaStatus(complaint)
  };
};

export const autoEscalateOverdue = (db) => {
  const manager = db.prepare("SELECT id FROM users WHERE role = 'manager' ORDER BY id LIMIT 1").get();
  if (!manager) return 0;

  const overdue = db.prepare(`
    SELECT * FROM complaints WHERE status IN ('new', 'assigned', 'in_progress')
  `).all().filter(complaint => getSlaStatus(complaint) === 'breached');

  if (overdue.length === 0) return 0;

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.transaction(() => {
    for (const complaint of overdue) {
      const reason = 'Automatically escalated because the SLA deadline was exceeded.';
      db.prepare(`UPDATE complaints SET status = 'escalated', updated_at = ? WHERE id = ?`).run(now, complaint.id);
      db.prepare(`
        INSERT INTO escalations (complaint_id, escalated_by, reason, escalated_at)
        VALUES (?, ?, ?, ?)
      `).run(complaint.id, manager.id, reason, now);
      db.prepare(`
        INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, reason, changed_at)
        VALUES (?, ?, 'escalated', ?, ?, ?)
      `).run(complaint.id, complaint.status, manager.id, reason, now);
    }
  })();

  return overdue.length;
};
