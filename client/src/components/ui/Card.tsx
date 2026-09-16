import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden', className)} {...props}>
        {(title || subtitle) && (
          <div className="px-6 py-4 border-b border-gray-100">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    );
  }
);
Card.displayName = 'Card';
