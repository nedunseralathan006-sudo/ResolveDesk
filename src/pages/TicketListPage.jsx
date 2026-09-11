import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import { getCategories, getComplaints } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ROLES, STATUSES, PRIORITIES, SLA_STATUSES } from '../utils/constants';
import { StatusBadge, PriorityBadge, SlaBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatDateTime, formatTimeRemaining } from '../utils/sla';

const EMPTY_FILTERS = {
  search: '', status: '', priority: '', category_id: '', sla_status: '', created_from: '', created_to: ''
};

export default function TicketListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const requestId = useRef(0);
  const [, setClock] = useState(Date.now());

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const fetchTickets = async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const data = await getComplaints(filters);
      if (currentRequest === requestId.current) setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    requestId.current += 1;
    setFilters({ ...EMPTY_FILTERS });
  };

  const title = user.role === ROLES.MANAGER ? 'All Tickets' : user.role === ROLES.AGENT ? 'My Assignments' : 'My Complaints';

  return (
    <>
      <Header title={title}>
        {user.role !== ROLES.AGENT && (
          <button className="btn btn-primary" onClick={() => navigate('/complaints/new')}>New Complaint</button>
        )}
      </Header>
      
      <div className="content-scroll">
        <div className="page-content">
          <div className="filter-bar">
            <input type="text" name="search" placeholder="Search ID or Subject..." value={filters.search} onChange={handleFilterChange} className="search-input" />
            <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
              <option value="">All Statuses</option>
              {Object.values(STATUSES).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="priority" value={filters.priority} onChange={handleFilterChange} className="filter-select">
              <option value="">All Priorities</option>
              {Object.values(PRIORITIES).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select name="category_id" value={filters.category_id} onChange={handleFilterChange} className="filter-select">
              <option value="">All Categories</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            {user.role !== ROLES.CUSTOMER && (
              <select name="sla_status" value={filters.sla_status} onChange={handleFilterChange} className="filter-select">
                <option value="">All SLA Statuses</option>
                {Object.values(SLA_STATUSES).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <input type="date" name="created_from" value={filters.created_from} onChange={handleFilterChange} className="filter-select" aria-label="Created from" />
            <input type="date" name="created_to" value={filters.created_to} onChange={handleFilterChange} className="filter-select" aria-label="Created to" />
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? <div style={{ padding: '2rem' }}><LoadingSpinner /></div> : 
             tickets.length === 0 ? <EmptyState title="No tickets found" message="Try adjusting your filters or create a new complaint." /> : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Subject</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assignee</th>
                      <th>SLA / Due</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.ticket_id} onClick={() => navigate(`/tickets/${t.ticket_id}`)}>
                        <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{t.ticket_id}</td>
                        <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>{t.agent_name || <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>}</td>
                        <td>
                          <SlaBadge slaStatus={t.sla_status} deadline={t.sla_deadline} />
                          <div className="sla-due-time">
                            Due {formatDateTime(t.sla_deadline)}
                            <br />
                            {formatTimeRemaining(t.sla_deadline)}
                          </div>
                        </td>
                        <td>{formatDate(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
