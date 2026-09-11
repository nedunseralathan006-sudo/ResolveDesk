import React from 'react';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div style={{ marginTop: '1rem' }}>{text}</div>
    </div>
  );
}
