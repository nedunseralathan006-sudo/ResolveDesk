import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export default function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        CMS
      </div>
      <nav className="sidebar-nav">
        {user.role === ROLES.MANAGER && (
          <>
            <NavLink to="/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
            <NavLink to="/reports" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>Reports</NavLink>
            <NavLink to="/tickets" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>All Tickets</NavLink>
            <NavLink to="/complaints/new" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>New Complaint</NavLink>
          </>
        )}
        {user.role === ROLES.AGENT && (
          <NavLink to="/tickets" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>My Assignments</NavLink>
        )}
        {user.role === ROLES.CUSTOMER && (
          <>
            <NavLink to="/tickets" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>My Complaints</NavLink>
            <NavLink to="/complaints/new" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>New Complaint</NavLink>
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <div>{user.full_name}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>{user.role}</div>
        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
