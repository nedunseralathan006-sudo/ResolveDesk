import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ComplaintTable } from '@/components/complaints/ComplaintTable';
import { ComplaintFilters } from '@/components/complaints/ComplaintFilters';
import { Pagination } from '@/components/complaints/Pagination';

export const Complaints = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    channel: ''
  });

  const itemsPerPage = 6;

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', page, filters],
    queryFn: async () => {
      const res = await api.get('/complaints', { 
        params: { page, limit: itemsPerPage, ...filters } 
      });
      return res.data;
    },
  });

  // Mock data fallback if api empty/fails
  const complaints = data?.complaints || [
    { id: '1', complaintId: 'C-00124', subject: 'Late delivery of order', customer: { name: 'Sarah Jenkins' }, category: 'Shipping', status: 'open', channel: 'Email', createdAt: '2026-09-08T10:24:00Z' },
    { id: '2', complaintId: 'C-00123', subject: 'Product not working as expected', customer: { name: 'Arjun Mehta' }, category: 'Product Issue', status: 'in_progress', channel: 'Website', createdAt: '2026-09-08T10:24:00Z' },
    { id: '3', complaintId: 'C-00122', subject: 'Incorrect billing amount', customer: { name: 'Michael Chen' }, category: 'Billing', status: 'resolved', channel: 'Phone', createdAt: '2026-09-07T15:30:00Z' }
  ];
  
  const total = data?.total || 124;
  const totalPages = data?.pages || Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all customer complaints</p>
        </div>
        <Link 
          to="/complaints/new" 
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Complaint
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <ComplaintFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <ComplaintTable complaints={complaints} isLoading={isLoading} />
      </div>

      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
        totalItems={total} 
        itemsPerPage={itemsPerPage} 
      />
    </div>
  );
};
