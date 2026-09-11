export const STATUSES = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const STATUS_LABELS = {
  [STATUSES.NEW]: 'New',
  [STATUSES.ASSIGNED]: 'Assigned',
  [STATUSES.IN_PROGRESS]: 'In Progress',
  [STATUSES.ESCALATED]: 'Escalated',
  [STATUSES.RESOLVED]: 'Resolved',
  [STATUSES.CLOSED]: 'Closed'
};

export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const PRIORITY_LABELS = {
  [PRIORITIES.LOW]: 'Low',
  [PRIORITIES.MEDIUM]: 'Medium',
  [PRIORITIES.HIGH]: 'High',
  [PRIORITIES.CRITICAL]: 'Critical'
};

export const CHANNELS = {
  PHONE: 'phone',
  EMAIL: 'email',
  WEBSITE: 'website',
  IN_PERSON: 'in-person',
  OTHER: 'other'
};

export const CHANNEL_LABELS = {
  [CHANNELS.PHONE]: 'Phone',
  [CHANNELS.EMAIL]: 'Email',
  [CHANNELS.WEBSITE]: 'Website',
  [CHANNELS.IN_PERSON]: 'In Person',
  [CHANNELS.OTHER]: 'Other'
};

export const SLA_STATUSES = {
  WITHIN: 'within_sla',
  AT_RISK: 'at_risk',
  BREACHED: 'breached'
};

export const SLA_LABELS = {
  [SLA_STATUSES.WITHIN]: 'Within SLA',
  [SLA_STATUSES.AT_RISK]: 'Due Soon',
  [SLA_STATUSES.BREACHED]: 'Breached'
};

export const SLA_HOURS = {
  [PRIORITIES.CRITICAL]: 4,
  [PRIORITIES.HIGH]: 8,
  [PRIORITIES.MEDIUM]: 24,
  [PRIORITIES.LOW]: 48
};

export const ROLES = {
  CUSTOMER: 'customer',
  AGENT: 'agent',
  MANAGER: 'manager',
  ADMIN: 'manager'
};
