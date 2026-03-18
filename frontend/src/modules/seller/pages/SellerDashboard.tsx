import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import OrderChart from '../components/OrderChart';
import AlertCard from '../components/AlertCard';
import { getSellerDashboardStats, DashboardStats, NewOrder } from '../../../services/api/dashboardService';
import { getSellerProfile, toggleShopStatus } from '../../../services/api/auth/sellerAuthService';
import { useAuth } from '../../../context/AuthContext';
import { seedSellerProducts } from '../../../utils/seedSellerProducts';
import { getSellerSpinWheelCampaign } from '../../../services/api/sellerSpinWheelService';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [newOrders, setNewOrders] = useState<NewOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, profileResponse] = await Promise.all([
          getSellerDashboardStats(),
          getSellerProfile()
        ]);

        if (statsResponse.success) {
          setStats(statsResponse.data.stats);
          setNewOrders(statsResponse.data.newOrders);
        } else {
          setError(statsResponse.message || 'Failed to fetch dashboard data');
        }

        if (profileResponse.success) {
          // Use nullish coalescing to default to true if isShopOpen is undefined
          const shopStatus = profileResponse.data.isShopOpen ?? true;
          console.log('Initial shop status from profile:', shopStatus, 'Raw value:', profileResponse.data.isShopOpen);
          setIsShopOpen(shopStatus);

          // Sync deposit fields from profile into auth context so SellerAccessGuard stays accurate
          if (user) {
            const profileData = profileResponse.data;
            const needsSync =
              user.depositPaid !== profileData.depositPaid ||
              user.securityDepositStatus !== profileData.securityDepositStatus ||
              user.securityDeposit !== profileData.securityDeposit;

            if (needsSync) {
              updateUser({
                ...user,
                depositPaid: profileData.depositPaid,
                securityDepositStatus: profileData.securityDepositStatus,
                depositAmount: profileData.depositAmount,
                depositPaidAt: profileData.depositPaidAt,
                securityDepositPaidAt: profileData.securityDepositPaidAt,
                securityDeposit: profileData.securityDeposit,
                status: profileData.status,
                userType: 'Seller',
              });
            }
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const key = `spin-wheel-auto-seller-${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    getSellerSpinWheelCampaign()
      .then((res) => {
        if (res?.success && res?.data?.campaign && !res?.data?.mySpin) {
          navigate("/seller/spin-wheel");
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleToggleShop = async () => {
    try {
      setStatusLoading(true);
      console.log('Toggle shop status - current state:', isShopOpen);
      const response = await toggleShopStatus();
      console.log('Toggle shop status - API response:', response);

      if (response.success) {
        setIsShopOpen(response.data.isShopOpen);
        alert(`Shop is now ${response.data.isShopOpen ? 'Open' : 'Closed'}`);
      } else {
        console.error('Toggle failed - response not successful:', response);
        alert('Failed to toggle shop status: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Failed to toggle shop status - error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert('Error toggling shop status: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setStatusLoading(false);
    }
  };


  const getStatusBadgeClass = (status: NewOrder['status']) => {
    switch (status) {
      case 'Out For Delivery':
        return 'text-blue-800 bg-blue-100 border border-blue-400';
      case 'Received':
        return 'text-blue-600 bg-blue-50';
      case 'Payment Pending':
        return 'text-orange-600 bg-orange-50';
      case 'Cancelled':
        return 'text-red-600 bg-pink-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const totalPages = Math.ceil(newOrders.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedOrders = newOrders.slice(startIndex, endIndex);

  // Icons for KPI cards
  const userIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );

  const categoryIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const subcategoryIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const productIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ordersIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const completedOrdersIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 7H18C19.1046 7 20 7.89543 20 9V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9C4 7.89543 4.89543 7 6 7H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const pendingOrdersIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const cancelledOrdersIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 7L8 15M8 7L16 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 7H18C19.1046 7 20 7.89543 20 9V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9C4 7.89543 4.89543 7 6 7H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  
  const walletIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 12V8C20 6.89543 19.1046 6 18 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H18C19.1046 18 20 17.1046 20 16V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 12C16 13.1046 16.8954 14 18 14H22V10H18C16.8954 10 16 10.8954 16 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Alert icons
  const soldOutIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const lowStockIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9V15M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-red-500 bg-white rounded-lg shadow-sm border border-neutral-200">
        {error || 'Stats not available'}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Security Deposit Warning Banner */}
      {(user?.securityDepositStatus !== 'Paid' && !user?.depositPaid) && (
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-md overflow-hidden animate-pulse-slow">
          <div className="px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="text-white">
                <h3 className="text-sm sm:text-base font-bold">Action Required: Security Deposit Pending</h3>
                <p className="text-xs text-orange-50 opacity-90">Please pay the ₹1000 security deposit to start adding products and receiving orders.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/seller/deposit-payment')}
              className="w-full sm:w-auto px-6 py-2 bg-white text-orange-600 font-bold text-sm rounded-lg hover:bg-orange-50 transition-colors shadow-sm"
            >
              Pay Now
            </button>
          </div>
        </div>
      )}

      {/* Header with Shop Status Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border border-neutral-200 gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your store performance</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <span className={`text-sm font-medium ${isShopOpen ? 'text-green-600' : 'text-red-500'}`}>
            {isShopOpen ? 'Shop is Live' : 'Shop is Closed'}
          </span>
          <button
            onClick={handleToggleShop}
            disabled={statusLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${isShopOpen ? 'bg-teal-600' : 'bg-gray-200'
              } ${statusLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`${isShopOpen ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>
      {/* Product Limit Warning */}
      {stats && stats.totalProduct > 200 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700 font-medium">
                You have exceeded the free product limit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Deposit Info
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user?.depositPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {user?.depositPaid ? 'Paid' : 'Pending'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Required Amount</p>
              <p className="text-lg font-bold text-gray-900">₹1000</p>
            </div>
            <div>
              <p className="text-xs text-orange-600 uppercase font-bold mb-1">Current Balance</p>
              <p className="text-lg font-bold text-orange-600">₹{user?.securityDeposit ?? 1000}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Amount Paid</p>
              <p className="text-lg font-bold text-gray-900">₹{user?.depositPaid ? (user?.depositAmount ?? 0) : 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Payment Date</p>
              <p className="text-sm font-medium text-gray-900">
                {user?.depositPaid && (user?.depositPaidAt || user?.securityDepositPaidAt)
                  ? new Date((user?.depositPaidAt || user?.securityDepositPaidAt)!).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
              <p className="text-sm font-medium text-gray-900">{user?.securityDepositStatus || 'Pending'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Type</p>
              <p className="text-sm font-medium text-gray-900">Refundable Security Deposit</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        <DashboardCard 
          icon={walletIcon} 
          title="Security Deposit Balance" 
          value={`₹${user?.securityDeposit ?? 1000}`} 
          accentColor="#0d9488" 
        />
        <DashboardCard icon={ordersIcon} title="Total Orders" value={stats.totalOrders} accentColor="#3b82f6" />
        <DashboardCard icon={completedOrdersIcon} title="Completed Orders" value={stats.completedOrders} accentColor="#16a34a" />
        <DashboardCard icon={pendingOrdersIcon} title="Pending Orders" value={stats.pendingOrders} accentColor="#a855f7" />
        <DashboardCard icon={cancelledOrdersIcon} title="Cancelled Orders" value={stats.cancelledOrders} accentColor="#ef4444" />
        <DashboardCard icon={productIcon} title="Total Product" value={stats.totalProduct} accentColor="#f97316" />
        <div
          onClick={() => navigate("/seller/spin-wheel")}
          className="bg-white rounded-lg shadow-sm border border-neutral-200 p-3 sm:p-4 md:p-5 cursor-pointer hover:shadow-md transition-shadow"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/seller/spin-wheel");
          }}
        >
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: `#10b98120` }}>
              <div style={{ color: "#10b981" }} className="w-6 h-6 sm:w-8 sm:h-8">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v3" />
                  <path d="M21 12h-3" />
                  <path d="M12 21v-3" />
                  <path d="M3 12h3" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="text-neutral-600 text-xs sm:text-sm font-medium mb-1">Spin &amp; Win</h3>
          <p className="text-xl sm:text-2xl font-bold text-neutral-900">Daily</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <OrderChart title={`Order - ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`} data={stats.dailyOrderData} maxValue={Math.max(...stats.dailyOrderData.map(d => d.value), 5)} height={400} />
        <OrderChart title={`Order - ${new Date().getFullYear()}`} data={stats.yearlyOrderData} maxValue={Math.max(...stats.yearlyOrderData.map(d => d.value), 20)} height={400} />
      </div>

      {/* Alerts and Button Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Alert Cards - Side by Side */}
        <AlertCard icon={soldOutIcon} title="Product Sold Out" value={stats.soldOutProducts} accentColor="#ec4899" />
        <AlertCard icon={lowStockIcon} title="Product low on Stock" value={stats.lowStockProducts} accentColor="#eab308" />
      </div>

      {/* View New Orders Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {/* Teal Header Bar */}
        <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
          <h2 className="text-base sm:text-lg font-semibold">View New Orders</h2>
        </div>

        {/* Show Entries Control */}
        <div className="px-4 sm:px-6 py-3 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-700">Show</span>
            <input
              type="number"
              value={entriesPerPage}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 10;
                setEntriesPerPage(Math.max(1, Math.min(100, value)));
                setCurrentPage(1);
              }}
              className="w-16 px-2 py-1 border border-neutral-300 rounded text-sm text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              min="1"
              max="100"
            />
            <span className="text-sm text-neutral-700">entries</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    O. Date
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-neutral-400 cursor-pointer"
                    >
                      <path
                        d="M7 10L12 5L17 10M7 14L12 19L17 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Status
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-neutral-400 cursor-pointer"
                    >
                      <path
                        d="M7 10L12 5L17 10M7 14L12 19L17 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Amount
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-neutral-400 cursor-pointer"
                    >
                      <path
                        d="M7 10L12 5L17 10M7 14L12 19L17 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Action
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-neutral-400 cursor-pointer"
                    >
                      <path
                        d="M7 10L12 5L17 10M7 14L12 19L17 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {displayedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900">{order.id}</td>
                  <td className="px-4 sm:px-6 py-3 text-sm text-neutral-600">{order.orderDate}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-sm text-neutral-900">₹ {order.amount}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <button
                      onClick={() => navigate(`/seller/orders/${order.id}`)}
                      className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded transition-colors"
                      aria-label="View order details"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="11"
                          cy="11"
                          r="8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 21L16.65 16.65"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm text-neutral-700">
            Showing {startIndex + 1} to {Math.min(endIndex, newOrders.length)} of {newOrders.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 border border-neutral-300 rounded ${currentPage === 1
                ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              aria-label="Previous page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 border border-neutral-300 rounded ${currentPage === totalPages
                ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              aria-label="Next page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

