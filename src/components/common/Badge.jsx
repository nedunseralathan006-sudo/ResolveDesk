import React from 'react';
import { STATUS_LABELS, PRIORITY_LABELS, SLA_LABELS, STATUSES, PRIORITIES, SLA_STATUSES } from '../../utils/constants';
import { getSlaStatusClass, formatTimeRemaining } from '../../utils/sla';

export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const className = `badge badge-${status?.replace('_', '-')}`;
  return <span className={className}>{label}</span>;
}

export function PriorityBadge({ priority }) {
  const label = PRIORITY_LABELS[priority] || priority;
  const className = `badge priority-${priority}`;
  return <span className={className}>{label}</span>;
}

export function SlaBadge({ slaStatus, deadline }) {
  const label = SLA_LABELS[slaStatus] || slaStatus;
  const className = `badge ${getSlaStatusClass(slaStatus)}`;
  const timeInfo = deadline ? ` (${formatTimeRemaining(deadline)})` : '';
  return <span className={className} title={timeInfo}>{label}</span>;
}
