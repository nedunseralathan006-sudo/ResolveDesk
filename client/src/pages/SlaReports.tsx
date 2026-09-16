import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ShieldAlert, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export const SlaReports = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['reports', 'sla'],
    queryFn: async () => {
      const res = await api.get('/reports/sla');
      return res.data;
    },
  });

  const mockStats = stats || {
    complianceRate: 94.2,
    breached: 12,
    atRisk: 28,
    avgResolutionTime: '4.2 hrs',
    totalTracked: 1240
  };

  const mockBreaches = [
    { id: '1', complaintId: 'C-00142', subject: 'Refund not processed', priority: 'High', breachTime: '2 hours ago', status: 'open' },
    { id: '2', complaintId: 'C-00138', subject: 'Account locked', priority: 'Critical', breachTime: '5 hours ago', status: 'in_progress' }
  ];

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${color.bg}`}>
        <Icon className={`h-6 w-6 ${color.text}`} />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SLA & Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor SLA compliance and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Compliance Rate" 
          value={`${mockStats.complianceRate}%`}
          icon={CheckCircle}
          color={{ bg: 'bg-green-100', text: 'text-green-600' }}
        />
        <StatCard 
          title="SLA Breached" 
          value={mockStats.breached}
          icon={ShieldAlert}
          color={{ bg: 'bg-red-100', text: 'text-red-600' }}
        />
        <StatCard 
          title="At Risk" 
          value={mockStats.atRisk}
          icon={AlertTriangle}
          color={{ bg: 'bg-amber-100', text: 'text-amber-600' }}
        />
        <StatCard 
          title="Avg Resolution" 
          value={mockStats.avgResolutionTime}
          icon={Clock}
          color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
        />
        <StatCard 
          title="Total Tracked" 
          value={mockStats.totalTracked}
          icon={TrendingUp}
          color={{ bg: 'bg-gray-100', text: 'text-gray-600' }}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Recent SLA Breaches</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breached By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockBreaches.map((breach) => (
              <tr key={breach.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{breach.complaintId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{breach.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    breach.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {breach.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{breach.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{breach.breachTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
