import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming there's a hook, or we can use local debounce logic if not present. If it fails to import, I'll provide an inline debounce. We'll implement an inline one to be safe.

export const ComplaintFilters = ({ filters, onChange }: { filters: any, onChange: (f: any) => void }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onChange({ ...filters, search: searchTerm });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, onChange]);

  const handleChange = (key: string, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow text-sm"
          placeholder="Search complaints by ID, subject, or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Selects Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <select
          className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm text-gray-700 bg-white"
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm text-gray-700 bg-white"
          value={filters.category}
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Product Issue">Product Issue</option>
          <option value="Billing">Billing</option>
          <option value="Shipping">Shipping</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Other">Other</option>
        </select>

        <select
          className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm text-gray-700 bg-white"
          value={filters.channel}
          onChange={(e) => handleChange('channel', e.target.value)}
        >
          <option value="">All Channels</option>
          <option value="Website">Website</option>
          <option value="Email">Email</option>
          <option value="Phone">Phone</option>
          <option value="In-Person">In-Person</option>
        </select>
      </div>
    </div>
  );
};
