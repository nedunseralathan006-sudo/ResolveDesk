import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ChevronDown, GripHorizontal, Activity, CheckCircle, Clock } from 'lucide-react';
import api from '@/lib/api';

export const Dashboard = () => {
  const [dateRange, setDateRange] = useState('This Month');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: async () => {
      const res = await api.get('/dashboard/trends');
      return res.data;
    },
  });

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['dashboard', 'channels'],
    queryFn: async () => {
      const res = await api.get('/dashboard/channels');
      return res.data;
    },
  });

  const { data: priorities, isLoading: prioritiesLoading } = useQuery({
    queryKey: ['dashboard', 'priorities'],
    queryFn: async () => {
      const res = await api.get('/dashboard/priorities');
      return res.data;
    },
  });

  // Map API data to expected chart format
  const mappedTrends = Array.isArray(trends) ? trends.map((t: any) => ({ date: t._id, count: t.count })) : [];
  const mockTrends = trends !== undefined ? mappedTrends : [
    { date: '2026-09-01', count: 12 }, { date: '2026-09-05', count: 19 },
    { date: '2026-09-10', count: 15 }, { date: '2026-09-15', count: 25 },
    { date: '2026-09-20', count: 22 }, { date: '2026-09-25', count: 30 }
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#6b7280'];
  const mappedChannels = Array.isArray(channels) ? channels.map((c: any, i: number) => ({ name: c._id, value: c.count, color: COLORS[i % COLORS.length] })) : [];
  const mockChannels = channels !== undefined ? mappedChannels : [
    { name: 'Website', value: 42, color: '#3b82f6' },
    { name: 'Email', value: 35, color: '#22c55e' },
    { name: 'Phone', value: 25, color: '#f59e0b' },
    { name: 'In-Person', value: 12, color: '#a855f7' },
    { name: 'Other', value: 10, color: '#6b7280' }
  ];

  const totalChannels = mockChannels.reduce((acc: number, curr: any) => acc + curr.value, 0);

  const StatCard = ({ title, count, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm">
      <div className="flex items-center mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900">{count}</div>
        <div className="text-sm text-gray-500 font-medium mt-1">{title}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of complaints and service performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 flex items-center gap-2 cursor-pointer shadow-sm hover:bg-gray-50 transition-colors">
            Sep 1, 2026 – Sep 30, 2026
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Complaints" 
          count={stats?.total ?? 124} 
          icon={GripHorizontal} 
          colorClass="text-white" 
          bgClass="bg-blue-600" 
        />
        <StatCard 
          title="Open" 
          count={stats?.open ?? 32} 
          icon={Activity} 
          colorClass="text-white" 
          bgClass="bg-amber-500" 
        />
        <StatCard 
          title="In Progress" 
          count={stats?.inProgress ?? 46} 
          icon={Clock} 
          colorClass="text-white" 
          bgClass="bg-blue-500" 
        />
        <StatCard 
          title="Resolved" 
          count={stats?.resolved ?? 42} 
          icon={CheckCircle} 
          colorClass="text-white" 
          bgClass="bg-green-500" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-gray-900">Complaints Trend</h2>
            <div className="text-sm text-gray-500 flex items-center gap-1 cursor-pointer">
              This Month <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => {
                    try {
                      return format(new Date(val), 'MMM d');
                    } catch (e) {
                      return '';
                    }
                  }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <RechartsTooltip 
                  labelFormatter={(val) => {
                    try {
                      return format(new Date(val), 'MMM d, yyyy');
                    } catch (e) {
                      return val;
                    }
                  }}
                  contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Complaints by Channel</h2>
          <div className="relative h-48 w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockChannels}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {mockChannels.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{totalChannels}</span>
              <span className="text-xs text-gray-500 font-medium">Total</span>
            </div>
          </div>
          
          <div className="mt-auto pt-6 space-y-3">
            {mockChannels.map((channel: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }}></span>
                  <span className="text-gray-600">{channel.name}</span>
                </div>
                <span className="font-medium text-gray-900">{channel.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Priority Distribution</h2>
          <div className="space-y-5 mt-2 flex-1">
            {[
              { name: 'Critical', value: priorities?.find((p: any) => p._id === 'Critical')?.count || 12, color: 'bg-red-500' },
              { name: 'High', value: priorities?.find((p: any) => p._id === 'High')?.count || 28, color: 'bg-orange-500' },
              { name: 'Medium', value: priorities?.find((p: any) => p._id === 'Medium')?.count || 45, color: 'bg-blue-500' },
              { name: 'Low', value: priorities?.find((p: any) => p._id === 'Low')?.count || 39, color: 'bg-gray-400' },
            ].map((priority, index, arr) => {
              const max = Math.max(...arr.map(p => p.value));
              const percentage = (priority.value / (max || 1)) * 100;
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{priority.name}</span>
                    <span className="font-medium text-gray-900">{priority.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${priority.color}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
