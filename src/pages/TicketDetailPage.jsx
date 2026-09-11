import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import {
  getComplaint, updateComplaintStatus, assignComplaint,
  escalateComplaint, submitFeedback, getAgents
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ROLES, STATUSES, STATUS_LABELS } from '../utils/constants';
import { StatusBadge, PriorityBadge, SlaBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDateTime, timeAgo, formatTimeRemaining } from '../utils/sla';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showAssign, setShowAssign] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);

  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [resolveDesc, setResolveDesc] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

  const fetchTicket = useCallback(async () => {
    try {
      const data = await getComplaint(ticketId);
      setTicket(data);
    } catch (e) {
      showError(e.message || 'Failed to load ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const loadAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (e) {
      showError('Failed to load agents');
    }
  };

  const doAction = async (fn, successMsg) => {
    setActionLoading(true);
    try {
      await fn();
      showSuccess(successMsg);
      fetchTicket();
    } catch (e) {
      showError(e.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = (newStatus, extra = {}) =>
    doAction(() => updateComplaintStatus(ticketId, newStatus, extra),
      `Status updated to ${STATUS_LABELS[newStatus] || newStatus}`);

  const handleAssign = () => {
    if (!selectedAgent) return showError('Please select an agent');
    doAction(async () => {
      await assignComplaint(ticketId, Number(selectedAgent));
      setShowAssign(false);
      setSelectedAgent('');
    }, 'Ticket assigned successfully');
  };

  const handleEscalate = () => {
    if (escalateReason.trim().length < 10) return showError('Reason must be at least 10 characters');
    doAction(async () => {
      await escalateComplaint(ticketId, escalateReason.trim());
      setShowEscalate(false);
      setEscalateReason('');
    }, 'Ticket escalated');
  };

  const handleResolve = () => {
    if (resolveDesc.trim().length < 10) return showError('Resolution description must be at least 10 characters');
    doAction(async () => {
      await updateComplaintStatus(ticketId, STATUSES.RESOLVED, { resolution_description: resolveDesc.trim() });
      setShowResolve(false);
      setResolveDesc('');
    }, 'Ticket resolved successfully');
  };

  const handleFeedback = () => {
    if (feedbackRating < 1) return showError('Please select a star rating');
    doAction(async () => {
      await submitFeedback(ticketId, feedbackRating, feedbackComment);
    }, 'Thank you for your feedback!');
  };

  if (loading) return <LoadingSpinner />;
  if (!ticket) return null;

  // The API returns flat fields: customer_name, agent_name, category_name
  // and nested arrays: status_history, assignment_history, escalations, resolutions, feedback
  const latestResolution = ticket.resolutions && ticket.resolutions.length > 0
    ? ticket.resolutions[ticket.resolutions.length - 1]
    : null;
  const latestEscalation = ticket.escalations && ticket.escalations.length > 0
    ? ticket.escalations[ticket.escalations.length - 1]
    : null;

  const canAssign = user.role === ROLES.MANAGER
    && !['resolved', 'closed'].includes(ticket.status);

  const canEscalate = user.role === ROLES.MANAGER
    && ['assigned', 'in_progress', 'escalated'].includes(ticket.status);

  const canStartWork = [ROLES.AGENT, ROLES.MANAGER].includes(user.role)
    && [STATUSES.ASSIGNED, STATUSES.ESCALATED].includes(ticket.status)
    && (user.role === ROLES.MANAGER || ticket.assigned_agent_id === user.id);

  const canResolve = [ROLES.AGENT, ROLES.MANAGER].includes(user.role)
    && ticket.status === STATUSES.IN_PROGRESS
    && (user.role === ROLES.MANAGER || ticket.assigned_agent_id === user.id);

  const canClose = user.role === ROLES.MANAGER && ticket.status === STATUSES.RESOLVED;

  const canFeedback = user.role === ROLES.CUSTOMER
    && ticket.status === STATUSES.RESOLVED
    && !ticket.feedback
    && ticket.customer_id === user.id;

  return (
    <>
      <Header title={`Ticket ${ticket.ticket_id}`} subtitle={ticket.subject}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </Header>

      <div className="content-scroll">
        <div className="page-content">
          <div className="detail-layout">

            {/* LEFT COLUMN — Main Info */}
            <div>
              {/* Complaint Info */}
              <div className="card">
                <div className="detail-section">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                      {ticket.ticket_id}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    {ticket.subject}
                  </h2>
                  <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {ticket.description}
                  </p>
                </div>

                <div className="detail-section">
                  <div className="detail-grid">
                    <div>
                      <div className="detail-label">Customer</div>
                      <div className="detail-value">{ticket.customer_name}</div>
                    </div>
                    <div>
                      <div className="detail-label">Contact</div>
                      <div className="detail-value">{ticket.customer_email || '—'}</div>
                    </div>
                    <div>
                      <div className="detail-label">Category</div>
                      <div className="detail-value">{ticket.category_name}</div>
                    </div>
                    <div>
                      <div className="detail-label">Channel</div>
                      <div className="detail-value" style={{ textTransform: 'capitalize' }}>
                        {ticket.channel}
                      </div>
                    </div>
                    <div>
                      <div className="detail-label">Created</div>
                      <div className="detail-value">{formatDateTime(ticket.created_at)}</div>
                    </div>
                    {ticket.assigned_at && (
                      <div>
                        <div className="detail-label">Assigned</div>
                        <div className="detail-value">{formatDateTime(ticket.assigned_at)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Escalation Info */}
              {latestEscalation && (
                <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
                  <div className="detail-section">
                    <h3 style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>⚠ Escalated</h3>
                    <p style={{ marginBottom: '0.5rem' }}>{latestEscalation.reason}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      By {latestEscalation.escalated_by_name} · {timeAgo(latestEscalation.escalated_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Resolution */}
              {latestResolution && (
                <div className="card" style={{ borderLeft: '3px solid var(--success)' }}>
                  <div className="detail-section">
                    <h3 style={{ color: 'var(--success)', marginBottom: '0.75rem' }}>✓ Resolution</h3>
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>
                      {latestResolution.description}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Resolved by {latestResolution.resolved_by_name} · {formatDateTime(latestResolution.resolved_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Feedback */}
              {ticket.feedback && (
                <div className="card">
                  <div className="detail-section">
                    <h3 style={{ marginBottom: '0.75rem' }}>Customer Feedback</h3>
                    <div className="star-rating" style={{ marginBottom: '0.5rem' }}>
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={i <= ticket.feedback.rating ? '' : 'empty'}>★</span>
                      ))}
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {ticket.feedback.rating}/5
                      </span>
                    </div>
                    {ticket.feedback.comment && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        "{ticket.feedback.comment}"
                      </p>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      {timeAgo(ticket.feedback.submitted_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Status History Timeline */}
              <div className="card">
                <div className="detail-section">
                  <h3 style={{ marginBottom: '1rem' }}>Status History</h3>
                  <div className="timeline">
                    {(ticket.status_history || []).slice().reverse().map((h, i) => (
                      <div key={i} className="timeline-item">
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <StatusBadge status={h.new_status} />
                          <span className="timeline-date">{timeAgo(h.changed_at)}</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                          By {h.changed_by_name}
                          {h.reason ? ` · "${h.reason}"` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Action Panel */}
            <div className="action-panel">

              {/* Status & Primary Actions */}
              <div className="card">
                <div className="detail-label" style={{ marginBottom: '0.5rem' }}>Current Status</div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <StatusBadge status={ticket.status} />
                </div>

                {canStartWork && (
                  <button
                    id="btn-start-work"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={actionLoading}
                    onClick={() => setConfirmStatus('start')}
                  >
                    Start Working
                  </button>
                )}
                {canResolve && (
                  <button
                    id="btn-resolve"
                    className="btn btn-primary"
                    style={{ width: '100%', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                    disabled={actionLoading}
                    onClick={() => setShowResolve(true)}
                  >
                    Resolve Ticket
                  </button>
                )}
                {canClose && (
                  <button
                    id="btn-close"
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    disabled={actionLoading}
                    onClick={() => setConfirmStatus('close')}
                  >
                    Close Ticket
                  </button>
                )}
              </div>

              {/* SLA Panel */}
              <div className="card">
                <div className="detail-label" style={{ marginBottom: '0.5rem' }}>SLA Status</div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <SlaBadge slaStatus={ticket.sla_status} />
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: ticket.sla_status === 'breached' ? 'var(--danger)'
                    : ticket.sla_status === 'at_risk' ? 'var(--warning)' : 'var(--success)'
                }}>
                  {formatTimeRemaining(ticket.sla_deadline)}
                </div>
                <div className="detail-label" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  Deadline: {formatDateTime(ticket.sla_deadline)}
                </div>
                <div className="detail-label" style={{ fontSize: '0.75rem' }}>
                  SLA Target: {ticket.sla_hours}h ({ticket.priority})
                </div>
              </div>

              {/* Assignment Panel — Manager only */}
              {user.role === ROLES.MANAGER && (
                <div className="card">
                  <div className="detail-label" style={{ marginBottom: '0.5rem' }}>Assigned To</div>
                  <div style={{ marginBottom: '1rem', fontWeight: 500 }}>
                    {ticket.agent_name || <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>}
                  </div>
                  {canAssign && (
                    <button
                      id="btn-assign"
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                      disabled={actionLoading}
                      onClick={() => { loadAgents(); setShowAssign(true); }}
                    >
                      {ticket.agent_name ? 'Reassign Agent' : 'Assign Agent'}
                    </button>
                  )}
                  {ticket.assigned_at && (
                    <div className="detail-label" style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>
                      Assigned {timeAgo(ticket.assigned_at)}
                    </div>
                  )}
                </div>
              )}

              {/* Escalation Panel — Manager only */}
              {user.role === ROLES.MANAGER && (
                <div className="card">
                  <div className="detail-label" style={{ marginBottom: '0.5rem' }}>Escalation</div>
                  {ticket.status === STATUSES.ESCALATED ? (
                    <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
                      ⚠ This ticket is currently escalated.
                    </div>
                  ) : canEscalate ? (
                    <button
                      id="btn-escalate"
                      className="btn btn-danger"
                      style={{ width: '100%' }}
                      disabled={actionLoading}
                      onClick={() => setShowEscalate(true)}
                    >
                      Escalate Ticket
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Escalation not available for current status.
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Panel — Customer only, when resolved */}
              {canFeedback && (
                <div className="card">
                  <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>Rate Resolution</h3>
                  <div className="detail-label" style={{ marginBottom: '0.5rem' }}>
                    How satisfied are you?
                  </div>
                  <div className="star-rating interactive" style={{ marginBottom: '1rem' }}>
                    {[1,2,3,4,5].map(i => (
                      <span
                        key={i}
                        id={`star-${i}`}
                        className={i <= feedbackRating ? '' : 'empty'}
                        onClick={() => setFeedbackRating(i)}
                        title={`${i} star${i > 1 ? 's' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="feedback-comment">Comment (optional)</label>
                    <textarea
                      id="feedback-comment"
                      value={feedbackComment}
                      onChange={e => setFeedbackComment(e.target.value)}
                      placeholder="Share your experience..."
                      rows={3}
                    />
                  </div>
                  <button
                    id="btn-submit-feedback"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={actionLoading || feedbackRating === 0}
                    onClick={handleFeedback}
                  >
                    Submit Feedback
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm: Start Working */}
      <ConfirmDialog
        isOpen={confirmStatus === 'start'}
        title="Start Working"
        message="Mark this ticket as In Progress? This confirms you are actively working on it."
        confirmText="Start Working"
        confirmVariant="primary"
        onConfirm={() => { handleStatusChange(STATUSES.IN_PROGRESS); setConfirmStatus(null); }}
        onCancel={() => setConfirmStatus(null)}
      />

      {/* Confirm: Close Ticket */}
      <ConfirmDialog
        isOpen={confirmStatus === 'close'}
        title="Close Ticket"
        message="Are you sure you want to close this resolved ticket?"
        confirmText="Close Ticket"
        confirmVariant="primary"
        onConfirm={() => { handleStatusChange(STATUSES.CLOSED); setConfirmStatus(null); }}
        onCancel={() => setConfirmStatus(null)}
      />

      {/* Assign Agent Modal */}
      <Modal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        title="Assign Agent"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
            <button id="btn-confirm-assign" className="btn btn-primary" onClick={handleAssign} disabled={actionLoading}>
              {actionLoading ? 'Assigning…' : 'Assign'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="select-agent">Select Agent</label>
          <select id="select-agent" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
            <option value="">— Choose Agent —</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.active_complaints_count} active)
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Resolve Ticket Modal */}
      <Modal
        isOpen={showResolve}
        onClose={() => setShowResolve(false)}
        title="Resolve Ticket"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowResolve(false)}>Cancel</button>
            <button
              id="btn-confirm-resolve"
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
              onClick={handleResolve}
              disabled={actionLoading}
            >
              {actionLoading ? 'Resolving…' : 'Resolve'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="resolve-description">Resolution Details *</label>
          <textarea
            id="resolve-description"
            value={resolveDesc}
            onChange={e => setResolveDesc(e.target.value)}
            placeholder="Describe how this issue was resolved (min. 10 characters)..."
            rows={4}
          />
          {resolveDesc.length > 0 && resolveDesc.length < 10 && (
            <div className="form-error">Please provide at least 10 characters</div>
          )}
        </div>
      </Modal>

      {/* Escalate Ticket Modal */}
      <Modal
        isOpen={showEscalate}
        onClose={() => setShowEscalate(false)}
        title="Escalate Ticket"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEscalate(false)}>Cancel</button>
            <button id="btn-confirm-escalate" className="btn btn-danger" onClick={handleEscalate} disabled={actionLoading}>
              {actionLoading ? 'Escalating…' : 'Escalate'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="escalate-reason">Reason for Escalation *</label>
          <textarea
            id="escalate-reason"
            value={escalateReason}
            onChange={e => setEscalateReason(e.target.value)}
            placeholder="Provide a detailed reason for escalation (min. 10 characters)..."
            rows={4}
          />
          {escalateReason.length > 0 && escalateReason.length < 10 && (
            <div className="form-error">Please provide at least 10 characters</div>
          )}
        </div>
      </Modal>
    </>
  );
}
