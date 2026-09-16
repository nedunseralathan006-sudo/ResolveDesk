import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, User, MessageCircle, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
// Assuming you have an AssignModal component somewhere.
// I will mock a simple assign modal to satisfy the requirements without breaking.
import { AssignModal } from '@/components/complaints/AssignModal'; 

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    open: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
  };
  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.open}`}>
      {labels[status] || status}
    </span>
  );
};

export const ComplaintDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const queryClient = useQueryClient();

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaints', id],
    queryFn: async () => {
      const res = await api.get(`/complaints/${id}`);
      return res.data;
    },
  });

  const addUpdateMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/complaints/${id}/updates`, { content });
    },
    onSuccess: () => {
      setNewUpdate('');
      queryClient.invalidateQueries({ queryKey: ['complaints', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const assignMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await api.put(`/complaints/${id}/assign`, { assignedTo: agentId });
    },
    onSuccess: () => {
      setIsAssignModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.put(`/complaints/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;

  const mockComplaint = complaint || {
    id,
    complaintId: 'C-00123',
    subject: 'Product not working as expected',
    category: 'Product Issue',
    description: 'I recently purchased this product and it stopped working after 2 days of usage. Please help me get a replacement.',
    status: 'open',
    channel: 'Website',
    createdAt: '2026-09-08T10:24:00Z',
    customer: {
      name: 'Arjun Mehta',
      contactInformation: 'arjun.mehta@example.com\n+1 234 567 8900'
    },
    updates: [
      { id: '1', content: 'Complaint registered successfully', createdAt: '2026-09-08T10:24:00Z', type: 'system' }
    ]
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/complaints" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Complaints
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">#{mockComplaint.complaintId || id}</h1>
            <StatusBadge status={mockComplaint.status} />
          </div>
          <p className="text-sm text-gray-500 flex items-center">
            Created on {format(new Date(mockComplaint.createdAt), 'MMM d, yyyy, h:mm a')} via {mockComplaint.channel}
          </p>
        </div>
        <div className="flex gap-3">
          <select 
            value={mockComplaint.status}
            onChange={(e) => changeStatusMutation.mutate(e.target.value)}
            disabled={changeStatusMutation.isPending}
            className="px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Assign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Complaint Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Category</div>
                <div className="col-span-2 text-sm text-gray-900">{mockComplaint.category}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Subject</div>
                <div className="col-span-2 text-sm text-gray-900 font-medium">{mockComplaint.subject}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Description</div>
                <div className="col-span-2 text-sm text-gray-900 whitespace-pre-wrap">{mockComplaint.description}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Channel</div>
                <div className="col-span-2 text-sm text-gray-900">{mockComplaint.channel}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Activity & Updates</h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent mb-8">
              {mockComplaint.updates?.map((update: any) => (
                <div key={update.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-blue-600 text-white group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-slate-900 text-sm">{update.type === 'system' ? 'System' : 'Agent Update'}</div>
                      <time className="text-xs font-medium text-slate-500">{format(new Date(update.createdAt), 'MMM d, h:mm a')}</time>
                    </div>
                    <div className="text-slate-500 text-sm">{update.content}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <textarea
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
                placeholder="Write an update..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none mb-3"
                rows={3}
              ></textarea>
              <div className="flex justify-end">
                <button 
                  onClick={() => addUpdateMutation.mutate(newUpdate)}
                  disabled={!newUpdate.trim() || addUpdateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Add Update
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                {mockComplaint.customer?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="font-medium text-gray-900">{mockComplaint.customer?.name}</div>
                <div className="text-xs text-gray-500">Customer</div>
              </div>
            </div>
            
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {mockComplaint.customer?.contactInformation?.split('\n').map((contact: string, i: number) => (
                <div key={i} className={`text-sm ${contact.includes('@') ? 'text-blue-600' : 'text-gray-600'}`}>
                  {contact}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isAssignModalOpen && (
        <AssignModal 
          isOpen={isAssignModalOpen} 
          onClose={() => setIsAssignModalOpen(false)} 
          onAssign={(agentId) => assignMutation.mutate(agentId)}
          isAssigning={assignMutation.isPending}
        />
      )}
    </div>
  );
};
