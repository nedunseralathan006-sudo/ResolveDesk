import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ComplaintTable } from '@/components/complaints/ComplaintTable';
import { Pagination } from '@/components/complaints/Pagination';

export const MyTickets = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets', page, filter],
    queryFn: async () => {
      const res = await api.get('/tickets', { params: { page, status: filter !== 'all' ? filter : undefined } });
      return res.data;
    },
  });

  const complaints = data?.data || [];
  const total = data?.total || 0;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Complaints assigned to you</p>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm text-gray-700 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {complaints.length === 0 && !isLoading ? (
          <div className="p-12 text-center">
            <h3 className="text-base font-medium text-gray-900 mb-1">No tickets found</h3>
            <p className="text-sm text-gray-500">No tickets are currently assigned to you.</p>
          </div>
        ) : (
          <ComplaintTable complaints={complaints} isLoading={isLoading} />
        )}
      </div>

      {total > 0 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
          totalItems={total} 
          itemsPerPage={itemsPerPage} 
        />
      )}
    </div>
  );
};
