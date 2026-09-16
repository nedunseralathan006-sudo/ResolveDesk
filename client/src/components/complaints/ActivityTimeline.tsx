import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  complaintId: string;
  activities: any[];
  onAddActivity: (message: string) => Promise<void>;
}

export function ActivityTimeline({ complaintId, activities, onAddActivity }: ActivityTimelineProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddActivity(message);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDotColor = (type: string) => {
    switch (type) {
      case 'created':
      case 'assigned': return 'bg-blue-500';
      case 'resolved':
      case 'closed': return 'bg-green-500';
      case 'escalated': return 'bg-red-500';
      case 'status_change': return 'bg-blue-400';
      case 'priority_change': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-6">
        {activities?.map((activity, index) => (
          <div key={activity._id || index} className="relative pl-6">
            <div className="absolute left-0 top-1.5 bottom-[-1.5rem] w-px bg-gray-200" />
            <div className={cn("absolute left-[-4px] top-1.5 h-2 w-2 rounded-full", getDotColor(activity.type))} />
            <div>
              <p className="text-sm font-medium text-gray-900">{activity.message || activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(activity.createdAt), 'MMM d, yyyy, h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t mt-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Write an update..." 
            className="flex-1"
          />
          <Button type="submit" variant="primary" disabled={isSubmitting || !message.trim()}>
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}
