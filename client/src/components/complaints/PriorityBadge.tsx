import { cn } from '@/lib/utils';

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const styles: Record<string, string> = {
    'Critical': 'bg-red-100 text-red-600',
    'High': 'bg-orange-100 text-orange-600',
    'Medium': 'bg-amber-100 text-amber-600',
    'Low': 'bg-green-100 text-green-600',
  };

  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap', styles[priority] || styles['Low'], className)}>
      {priority}
    </span>
  );
}
