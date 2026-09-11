import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', confirmVariant = 'primary' }) {
  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      <button className={`btn btn-${confirmVariant}`} onClick={onConfirm}>{confirmText}</button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} footer={footer}>
      <p>{message}</p>
    </Modal>
  );
}
