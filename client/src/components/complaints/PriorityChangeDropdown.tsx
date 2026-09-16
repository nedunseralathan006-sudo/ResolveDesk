import React from 'react';
import { Select } from '@/components/ui/Select';

interface PriorityChangeDropdownProps {
  currentPriority: string;
  onPriorityChange: (newPriority: string) => void;
  disabled?: boolean;
}

export function PriorityChangeDropdown({ currentPriority, onPriorityChange, disabled }: PriorityChangeDropdownProps) {
  const options = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];

  return (
    <Select
      value={currentPriority}
      onChange={(e) => onPriorityChange(e.target.value)}
      disabled={disabled}
      options={options}
    />
  );
}
