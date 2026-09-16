import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Log out?</h3>
        <p className="text-sm text-gray-500 mb-6">Are you sure you want to log out from SupportTrack?</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} className="w-full">Cancel</Button>
          <Button variant="primary" className="w-full bg-red-600 hover:bg-red-700 text-white border-transparent" onClick={onConfirm}>Log out</Button>
        </div>
      </div>
    </Modal>
  );
};
