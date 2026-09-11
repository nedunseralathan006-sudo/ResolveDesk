import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import { getDashboardStats, getUrgentTickets, getAgents, getAllFeedback } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/common/Badge';
import { formatTimeRemaining, formatDateTime } from '../utils/sla';

function StatCard({ label, value, variant }) {
  const borderColor = variant === 'danger' ? 'var(--danger)'
    : variant === 'warning' ? 'var(--warning)'
    : variant === 'success' ? 'var(--success)'
    : 'var(--border)';

  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${borderColor}` }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{
        color: variant === 'danger' ? 'var(--danger)'
          : variant === 'warning' ? 'var(--warning)'
          : variant === 'success' ? 'var(--success)'
          : 'var(--text-primary)'
      }}>
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [urgent, setUrgent] = useState({ breached: [], at_risk: [] });
  const [agents, setAgents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [statsData, urgentData, agentsData, feedbackData] = await Promise.all([
        getDashboardStats().catch(() => ({ total: 0, by_status: {}, sla_breached: 0, sla_at_risk: 0 })),
        getUrgentTickets().catch(() => ({ breached: [], at_risk: [] })),
        getAgents().catch(() => []),
        getAllFeedback().catch(() => []),
      ]);
      setStats(statsData);
      setUrgent(urgentData);
      setAgents(agentsData);
      setFeedback(feedbackData);
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;

  const byStatus = stats?.by_status || {};
  const avgRating = stats?.average_rating ? Number(stats.average_rating).toFixed(1) : '—';

  return (
    <>
      <Header title="Manager Dashboard" subtitle="Real-time platform overview" />
      <div className="content-scroll">
        <div className="page-content">

          {/* KPI Stats */}
          <div className="stat-grid">
            <StatCard label="Total Complaints" value={stats?.total || 0} />
            <StatCard label="New" value={byStatus.new || 0} />
            <StatCard label="In Progress" value={byStatus.in_progress || 0} />
            <StatCard
              label="Escalated"
              value={byStatus.escalated || 0}
              variant={byStatus.escalated > 0 ? 'danger' : undefined}
            />
            <StatCard
              label="SLA Breached"
              value={stats?.sla_breached || 0}
              variant={stats?.sla_breached > 0 ? 'danger' : 'success'}
            />
            <StatCard
              label="SLA At Risk"
              value={stats?.sla_at_risk || 0}
              variant={stats?.sla_at_risk > 0 ? 'warning' : undefined}
            />
            <StatCard label="Resolved" value={byStatus.resolved || 0} variant="success" />
            <StatCard label="Avg. Rating" value={avgRating} variant={Number(avgRating) >= 4 ? 'success' : undefined} />
            <StatCard label="Avg. Resolution" value={stats?.average_resolution_hours ? `${stats.average_resolution_hours}h` : '—'} />
          </div>

          {/* Urgent Tickets Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
            {/* SLA Breached */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9375rem' }}>
                ⚠ SLA Breached ({urgent.breached.length})
              </h3>
              {urgent.breached.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  ✓ No breached tickets.
                </p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Subject</th>
                        <th>Priority</th>
                        <th>Overdue By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {urgent.breached.map(t => (
                        <tr key={t.ticket_id} onClick={() => navigate(`/tickets/${t.ticket_id}`)}>
                          <td style={{ fontWeight: 500, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                            {t.ticket_id}
                          </td>
                          <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.subject}
                          </td>
                          <td><PriorityBadge priority={t.priority} /></td>
                          <td style={{ color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                            {formatTimeRemaining(t.sla_deadline)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SLA At Risk */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ color: 'var(--warning)', marginBottom: '1rem', fontSize: '0.9375rem' }}>
                ⏰ SLA At Risk ({urgent.at_risk.length})
              </h3>
              {urgent.at_risk.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  ✓ No tickets approaching deadline.
                </p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Subject</th>
                        <th>Priority</th>
                        <th>Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {urgent.at_risk.map(t => (
                        <tr key={t.ticket_id} onClick={() => navigate(`/tickets/${t.ticket_id}`)}>
                          <td style={{ fontWeight: 500, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                            {t.ticket_id}
                          </td>
                          <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.subject}
                          </td>
                          <td><PriorityBadge priority={t.priority} /></td>
                          <td style={{ color: 'var(--warning)', whiteSpace: 'nowrap' }}>
                            {formatTimeRemaining(t.sla_deadline)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Agent Workload */}
          {agents.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>Agent Workload</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Email</th>
                      <th>Active Tickets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500 }}>{a.full_name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{a.email}</td>
                        <td>
                          <span style={{
                            fontWeight: 600,
                            color: a.active_complaints_count >= 5 ? 'var(--danger)'
                              : a.active_complaints_count >= 3 ? 'var(--warning)'
                              : 'var(--success)'
                          }}>
                            {a.active_complaints_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Feedback */}
          {feedback.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem' }}>
                Recent Customer Feedback
              </h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Customer</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.slice(0, 5).map(f => (
                      <tr key={f.id} onClick={() => navigate(`/tickets/${f.ticket_id}`)}>
                        <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{f.ticket_id}</td>
                        <td>{f.customer_name}</td>
                        <td>
                          <span style={{ color: f.rating >= 4 ? 'var(--success)' : f.rating >= 3 ? 'var(--warning)' : 'var(--danger)' }}>
                            {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.comment || '—'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(f.submitted_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
