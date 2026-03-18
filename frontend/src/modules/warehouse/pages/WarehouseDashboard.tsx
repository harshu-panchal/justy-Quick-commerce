import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, delay }: { title: string, value: string | number, icon: any, color: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/50 hover:shadow-md transition-shadow relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110 ${color}`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-neutral-900">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </motion.div>
);

const PackageIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [dashboardData, setDashboardData] = useState<any>({
    stats: { total: 0, pending: 0, completed: 0, lowStock: 0 },
    activities: [],
    chartData: []
  });

  useEffect(() => {
    refreshData();
  }, [timeRange]);

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API fetch delay
    setTimeout(() => {
      const isToday = timeRange === 'Today';
      setDashboardData({
        stats: {
          total: isToday ? 156 : 1284,
          pending: isToday ? 8 : 42,
          completed: isToday ? 148 : 156,
          lowStock: 12
        },
        activities: [
          { id: '8245', time: '2 mins ago', status: 'Success' },
          { id: '8244', time: '15 mins ago', status: 'Success' },
          { id: '8243', time: '1 hour ago', status: 'Success' },
          { id: '8242', time: '3 hours ago', status: 'Warning' },
          { id: '8241', time: '5 hours ago', status: 'Success' },
        ],
        chartData: isToday 
          ? [30, 45, 25, 60, 80, 55, 40] // Hourly or smaller range
          : [60, 80, 45, 90, 70, 55, 85] // Daily range
      });
      setIsLoading(false);
    }, 800);
  };

  const statConfig = [
    { title: 'Total Orders', key: 'total', icon: PackageIcon, color: 'bg-orange-500', delay: 0.1 },
    { title: 'Pending Fulfillment', key: 'pending', icon: ClockIcon, color: 'bg-amber-500', delay: 0.2 },
    { title: 'Completed Today', key: 'completed', icon: CheckIcon, color: 'bg-emerald-500', delay: 0.3 },
    { title: 'Low Stock Alerts', key: 'lowStock', icon: AlertIcon, color: 'bg-rose-500', delay: 0.4 },
  ];

  const menuItems = [
    { to: '/warehouse/dashboard', icon: PackageIcon, label: 'Dashboard' },
    { to: '/warehouse/orders', icon: PackageIcon, label: 'Orders' },
    { to: '/warehouse/cod', icon: PackageIcon, label: 'COD Collections' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Warehouse Overview</h1>
          <p className="text-neutral-500 mt-1">Efficiency is the heartbeat of logistics.</p>
        </div>
        <button 
          onClick={refreshData}
          disabled={isLoading}
          className={`px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all flex items-center gap-2 shadow-sm ${isLoading ? 'opacity-50' : 'active:scale-95'}`}
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statConfig.map((stat, index) => (
          <StatCard 
            key={index} 
            title={stat.title} 
            value={isLoading ? '...' : (dashboardData.stats as any)[stat.key]} 
            icon={stat.icon} 
            color={stat.color} 
            delay={stat.delay} 
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Fulfillment Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 min-h-[460px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Recent Fulfillment</h2>
            <button 
              onClick={() => navigate('/warehouse/orders')}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 active:scale-95 transition-all"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={`shimmer-${i}`} className="flex items-center gap-4 p-3 rounded-xl bg-neutral-50/50 animate-pulse">
                    <div className="w-10 h-10 rounded-lg bg-neutral-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-neutral-200 rounded" />
                      <div className="h-3 w-16 bg-neutral-100 rounded" />
                    </div>
                  </div>
                ))
              ) : (
                dashboardData.activities.map((act: any, i: number) => (
                  <motion.div 
                    key={act.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-neutral-900">Order #JS-{act.id}</p>
                      <p className="text-xs text-neutral-500">Processed {act.time}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        act.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {act.status}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Warehouse Efficiency Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 min-h-[460px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Avg. Processing Time</h2>
              <p className="text-xs text-neutral-500 font-medium">Performance metrics across warehouse</p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs font-bold bg-neutral-50 border-neutral-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer"
            >
              <option>Last 7 Days</option>
              <option>Today</option>
            </select>
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 px-2 mb-2">
            {dashboardData.chartData.map((h: number, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                <div className="relative w-full group flex flex-col justify-end h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: isLoading ? 0 : `${h}%` }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.1 * i }}
                    className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-xl relative shadow-lg shadow-orange-600/10 cursor-help"
                  />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-none z-10 whitespace-nowrap">
                    {h} mins
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-6 px-1 border-t border-neutral-50 pt-4">
            {(timeRange === 'Today' ? ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map(d => (
              <span key={d} className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter w-full text-center">{d}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
