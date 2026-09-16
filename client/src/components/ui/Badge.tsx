import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed' | 'Critical' | 'High' | 'Medium' | 'Low';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, children, ...props }, ref) => {
    const variants = {
      Open: 'bg-status-open-bg text-status-open',
      'In Progress': 'bg-status-in-progress-bg text-status-in-progress',
      Resolved: 'bg-status-resolved-bg text-status-resolved',
      Escalated: 'bg-status-escalated-bg text-status-escalated',
      Closed: 'bg-status-closed-bg text-status-closed',
      Critical: 'bg-priority-critical-bg text-priority-critical',
      High: 'bg-priority-high-bg text-priority-high',
      Medium: 'bg-priority-medium-bg text-priority-medium',
      Low: 'bg-priority-low-bg text-priority-low',
    };

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}
        {...props}
      >
        {children || variant}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
