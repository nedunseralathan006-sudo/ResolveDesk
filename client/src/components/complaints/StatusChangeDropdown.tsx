import React from 'react';
import { Select } from '@/components/ui/Select';

interface StatusChangeDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

export function StatusChangeDropdown({ currentStatus, onStatusChange, disabled }: StatusChangeDropdownProps) {
  let allowedOptions: { value: string; label: string }[] = [];

  if (currentStatus === 'Open') {
    allowedOptions = [
      { value: 'Open', label: 'Open' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'Escalated', label: 'Escalated' },
    ];
  } else if (currentStatus === 'In Progress') {
    allowedOptions = [
      { value: 'In Progress', label: 'In Progress' },
      { value: 'Resolved', label: 'Resolved' },
      { value: 'Escalated', label: 'Escalated' },
    ];
  } else if (currentStatus === 'Resolved') {
    allowedOptions = [
      { value: 'Resolved', label: 'Resolved' },
      { value: 'Closed', label: 'Closed' },
    ];
  } else if (currentStatus === 'Escalated') {
    allowedOptions = [
      { value: 'Escalated', label: 'Escalated' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'Resolved', label: 'Resolved' },
    ];
  } else {
    allowedOptions = [{ value: currentStatus, label: currentStatus }];
  }

  return (
    <Select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value)}
      disabled={disabled || allowedOptions.length <= 1}
      options={allowedOptions}
    />
  );
}
