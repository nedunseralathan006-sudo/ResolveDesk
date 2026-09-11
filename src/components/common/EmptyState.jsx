import React from 'react';

export default function EmptyState({ icon, title, message, actionText, onAction }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>}
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <p>{message}</p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction} style={{ marginTop: '1rem' }}>
          {actionText}
        </button>
      )}
    </div>
  );
}
