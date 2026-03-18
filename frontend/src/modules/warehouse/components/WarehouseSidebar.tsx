import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link to={to}>
    <motion.div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-orange-600 text-white shadow-lg' 
          : 'text-orange-100 hover:bg-orange-700/50 hover:text-white'
      }`}
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </motion.div>
  </Link>
);

const DashboardIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const OrdersIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CodIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function WarehouseSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { to: '/warehouse/dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { to: '/warehouse/orders', icon: OrdersIcon, label: 'Orders' },
    { to: '/warehouse/cod', icon: CodIcon, label: 'COD Collections' },
  ];

  const handleLogout = () => {
    // Clear any necessary session/storage
    navigate('/warehouse/login');
  };

  return (
    <aside className="w-64 bg-orange-800 h-screen flex flex-col p-4 text-white shadow-xl flex-shrink-0 overflow-y-auto border-r border-orange-700/30">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <span className="text-2xl">🏭</span>
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">Warehouse</h1>
          <p className="text-xs text-orange-200 uppercase tracking-widest font-semibold">Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={location.pathname === item.to}
          />
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-orange-700/50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-orange-100 hover:bg-red-600 hover:text-white transition-all group"
        >
          <LogoutIcon className="w-5 h-5 text-orange-300 group-hover:text-white" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
