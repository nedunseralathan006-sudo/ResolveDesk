import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { User } from '@/lib/types';

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (agentId: string) => void;
  isAssigning: boolean;
}

export function AssignModal({ isOpen, onClose, onAssign, isAssigning }: AssignModalProps) {
  const { data: agents, isLoading } = useQuery<User[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await api.get('/users/agents');
      return response.data;
    },
    enabled: isOpen,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Ticket">
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {agents?.map((agent) => (
              <div
                key={agent._id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => onAssign(agent._id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {agent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.email}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled={isAssigning}>
                  Assign
                </Button>
              </div>
            ))}
            {agents?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No agents available.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
