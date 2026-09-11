import { SLA_STATUSES } from './constants';

/** Parse both "2024-01-01T12:00:00" and "2024-01-01 12:00:00" (SQLite format) */
function parseDate(str) {
  if (!str) return null;
  const normalized = str.toString().replace(' ', 'T');
  const d = new Date(
    normalized.includes('Z') || normalized.includes('+')
      ? normalized
      : normalized + 'Z'
  );
  return isNaN(d.getTime()) ? null : d;
}

export function formatTimeRemaining(deadlineStr) {
  if (!deadlineStr) return '—';
  const deadline = parseDate(deadlineStr);
  if (!deadline) return '—';
  const now = new Date();
  const diffMs = deadline - now;
  const isOverdue = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);
  const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
  let timeStr = '';
  if (hours > 0) timeStr += `${hours}h `;
  timeStr += `${minutes}m`;
  return isOverdue ? `${timeStr} overdue` : `${timeStr} remaining`;
}

export function getSlaStatusClass(slaStatus) {
  switch (slaStatus) {
    case SLA_STATUSES.WITHIN: return 'sla-within';
    case SLA_STATUSES.AT_RISK: return 'sla-at-risk';
    case SLA_STATUSES.BREACHED: return 'sla-breached';
    default: return '';
  }
}

export function formatDateTime(str) {
  const d = parseDate(str);
  if (!d) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatDate(str) {
  const d = parseDate(str);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function timeAgo(str) {
  const d = parseDate(str);
  if (!d) return '';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
