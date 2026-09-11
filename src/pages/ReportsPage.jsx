import React, { useEffect, useState } from 'react';
import Header from '../components/Layout/Header';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getReports } from '../services/api';
import { STATUS_LABELS, PRIORITY_LABELS, CHANNEL_LABELS } from '../utils/constants';

function ReportTable({ title, rows, labelMap = {} }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
      {rows.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No data available.</p> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Group</th><th>Count</th><th>Share</th></tr></thead>
            <tbody>{rows.map(row => (
              <tr key={row.label}>
                <td style={{ textTransform: 'capitalize' }}>{labelMap[row.label] || row.label}</td>
                <td style={{ fontWeight: 600 }}>{row.count}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{total ? `${Math.round((row.count / total) * 100)}%` : '0%'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getReports().then(setReports).catch(() => setError('Unable to load report data.'));
  }, []);

  if (!reports && !error) return <LoadingSpinner />;

  return (
    <>
      <Header title="Reports & Analytics" subtitle="Complaint trends and service performance" />
      <div className="content-scroll">
        <div className="page-content">
          {error ? <div className="card form-error">{error}</div> : (
            <>
              <div className="stat-grid">
                <div className="stat-card"><div className="stat-label">Tracked Months</div><div className="stat-value">{reports.monthly.length}</div></div>
                <div className="stat-card"><div className="stat-label">Categories Used</div><div className="stat-value">{reports.categories.length}</div></div>
                <div className="stat-card"><div className="stat-label">Channels Used</div><div className="stat-value">{reports.channel.length}</div></div>
                <div className="stat-card"><div className="stat-label">Priorities Used</div><div className="stat-value">{reports.priority.length}</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                <ReportTable title="By Status" rows={reports.status} labelMap={STATUS_LABELS} />
                <ReportTable title="By Priority" rows={reports.priority} labelMap={PRIORITY_LABELS} />
                <ReportTable title="By Category" rows={reports.categories} />
                <ReportTable title="By Channel" rows={reports.channel} labelMap={CHANNEL_LABELS} />
              </div>
              <ReportTable title="Monthly Complaint Volume" rows={reports.monthly} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
