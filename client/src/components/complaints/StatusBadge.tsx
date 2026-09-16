import { cn } from '@/lib/utils';

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const styles: Record<string, string> = {
    'Open': 'bg-amber-100 text-amber-600',
    'In Progress': 'bg-blue-100 text-blue-600',
    'Resolved': 'bg-green-100 text-green-600',
    'Escalated': 'bg-red-100 text-red-600',
    'Closed': 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap', styles[status] || styles['Closed'], className)}>
      {status}
    </span>
  );
}
