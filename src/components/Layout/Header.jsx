import React from 'react';

export default function Header({ title, subtitle, children }) {
  return (
    <header className="app-header">
      <div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {subtitle && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{subtitle}</div>}
      </div>
      <div>
        {children}
      </div>
    </header>
  );
}
