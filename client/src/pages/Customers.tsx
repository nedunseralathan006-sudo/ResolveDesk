import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/complaints/Pagination';

export const Customers = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const { data } = await api.get('/api/customers', {
        params: { page, limit: 10, search: search || undefined }
      });
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage customer information</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2"/>
          Add Customer
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Customer ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Total Complaints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading customers...</td>
                </tr>
              ) : data?.customers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No customers found</td>
                </tr>
              ) : (
                data?.customers?.map((customer: any) => (
                  <tr key={customer._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      CU-{customer._id.substring(customer._id.length - 4).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">{customer.name}</td>
                    <td className="px-6 py-4 text-gray-500">{customer.email}</td>
                    <td className="px-6 py-4 text-gray-500">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 font-medium">{customer.totalComplaints}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={data.pages}
              totalItems={data.total}
              itemsPerPage={10}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
