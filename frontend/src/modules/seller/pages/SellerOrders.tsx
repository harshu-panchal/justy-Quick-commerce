import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, Order, GetOrdersParams } from '../../../services/api/orderService';


type SortField = 'orderId' | 'deliveryDate' | 'orderDate' | 'status' | 'amount';
type SortDirection = 'asc' | 'desc';

export default function SellerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState('');
  const [status, setStatus] = useState('All Status');
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const params: GetOrdersParams = {
          page: currentPage,
          limit: parseInt(entriesPerPage),
          sortBy: sortField || 'orderDate',
          sortOrder: sortDirection,
        };

        // Parse date range
        if (dateRange) {
          const [startDate, endDate] = dateRange.split(' - ');
          if (startDate && endDate) {
            params.dateFrom = startDate;
            params.dateTo = endDate;
          }
        }

        // Add status filter
        if (status !== 'All Status') {
          params.status = status;
        }

        // Add search
        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await getOrders(params);
        if (response.success && response.data) {
          setOrders(response.data);
        } else {
          setError(response.message || 'Failed to fetch orders');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dateRange, status, entriesPerPage, searchQuery, currentPage, sortField, sortDirection]);

  const handleClearDate = () => {
    setDateRange('');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Order ID', 'Delivery Date', 'Order Date', 'Status', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...orders.map(order =>
        [order.orderId, order.deliveryDate, order.orderDate, order.status, order.amount].join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination (client-side for now, can be moved to backend later)
  const entriesPerPageNum = parseInt(entriesPerPage);
  const totalPages = Math.ceil(orders.length / entriesPerPageNum);
  const startIndex = (currentPage - 1) * entriesPerPageNum;
  const endIndex = startIndex + entriesPerPageNum;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const [activeTab, setActiveTab] = useState('New');

  const tabs = [
    { label: 'New', count: orders.filter(o => ['Received', 'Pending'].includes(o.status)).length },
    { label: 'Preparing', count: orders.filter(o => ['Accepted', 'Processed'].includes(o.status)).length },
    { label: 'Ready', count: orders.filter(o => ['Ready', 'Ready for pickup'].includes(o.status)).length },
    { label: 'Picked Up', count: orders.filter(o => ['Shipped', 'Picked Up', 'In Transit', 'On the way', 'Out for Delivery'].includes(o.status)).length },
    { label: 'Past Orders', count: orders.filter(o => ['Delivered', 'Cancelled', 'Rejected', 'Returned'].includes(o.status)).length },
  ];

  const filteredOrders = orders.filter(order => {
    switch (activeTab) {
      case 'New': return ['Received', 'Pending'].includes(order.status);
      case 'Preparing': return ['Accepted', 'Processed'].includes(order.status);
      case 'Ready': return ['Ready', 'Ready for pickup'].includes(order.status);
      case 'Picked Up': return ['Shipped', 'Picked Up', 'In Transit', 'On the way', 'Out for Delivery'].includes(order.status);
      case 'Past Orders': return ['Delivered', 'Cancelled', 'Rejected', 'Returned'].includes(order.status);
      default: return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received':
      case 'Pending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Accepted':
      case 'Processed': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Ready':
      case 'Ready for pickup': return 'bg-teal-100 text-teal-600 border-teal-200';
      case 'Shipped':
      case 'Picked Up':
      case 'In Transit':
      case 'On the way':
      case 'Out for Delivery': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-600 border-green-200';
      case 'Cancelled':
      case 'Rejected':
      case 'Returned': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 -m-3 sm:-m-4 md:-m-6">
      {/* Fixed Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-900">Orders</h1>
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-full border border-neutral-200">
              {orders.length} TOTAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors" title="Export CSV">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button className="sm:hidden p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation - Swiggy Style */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-neutral-100 px-2 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`relative flex-shrink-0 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.label
                  ? 'text-teal-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{tab.label}</span>
                <span className={`flex items-center justify-center min-w-[18px] h-[18px] text-[10px] rounded-full border ${
                  activeTab === tab.label 
                    ? 'bg-teal-50 border-teal-200 text-teal-600 shadow-sm' 
                    : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                }`}>
                  {tab.count}
                </span>
              </div>
              {activeTab === tab.label && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-full shadow-[0_-2px_4px_rgba(13,148,136,0.2)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Quick Filters / Search Bar (Desktop) */}
        <div className="hidden sm:flex px-4 py-3 bg-neutral-50/50 items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID or customer..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
              />
           </div>
           <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Sort by:</span>
              <select className="bg-transparent text-xs font-semibold text-neutral-600 focus:outline-none cursor-pointer">
                <option>Newest First</option>
                <option>Oldest First</option>
                <option>Highest Amount</option>
              </select>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
            <p className="text-sm text-neutral-500 font-medium italic">Fetching your orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Unable to load orders</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white border border-red-200 text-red-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors shadow-sm">
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6 text-neutral-300">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-800">No {activeTab} Orders</h3>
            <p className="text-neutral-500 mt-2 max-w-xs">There are currently no orders in the {activeTab.toLowerCase()} stage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-20">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className="group bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/seller/orders/${order.id}`)}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-neutral-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ORDER ID</span>
                      <span className="text-sm font-black text-neutral-900">#{order.orderId}</span>
                    </div>
                    <div className="text-xs text-neutral-400 font-medium">
                      {new Date(order.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 text-[10px] font-bold border rounded-lg shadow-sm ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </div>
                </div>

                {/* Card Body - Brief Summary */}
                <div className="p-4 bg-neutral-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold shadow-inner">
                          {order.customerName?.[0] || 'C'}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-neutral-800">{order.customerName || 'Customer'}</p>
                          <p className="text-[11px] text-neutral-500 font-medium tracking-tight">View Details • Click to Manage</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-neutral-400 uppercase">AMOUNT</p>
                       <p className="text-base font-black text-teal-600">₹{order.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Actions based on tab */}
                  <div className="flex gap-2">
                    {activeTab === 'New' ? (
                      <>
                        <button className="flex-1 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-[0_4px_12px_rgba(13,148,136,0.3)]">
                          Accept Order
                        </button>
                        <button className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                          Reject
                        </button>
                      </>
                    ) : activeTab === 'Preparing' ? (
                      <button className="flex-1 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-[0_4px_12px_rgba(13,148,136,0.3)]">
                        Mark as Ready
                      </button>
                    ) : (
                      <button className="flex-1 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                        View Details
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar indication */}
                <div className="h-1 w-full bg-neutral-100 group-hover:bg-teal-50 transition-colors">
                  <div 
                    className={`h-full bg-teal-500 transition-all duration-500 ${
                      activeTab === 'New' ? 'w-[20%]' : 
                      activeTab === 'Preparing' ? 'w-[40%]' : 
                      activeTab === 'Ready' ? 'w-[60%]' : 
                      activeTab === 'Picked Up' ? 'w-[80%]' : 'w-full'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Pagination / Summary Footer for Desktop */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-10 sm:translate-x-0 z-30 flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md border border-neutral-200 rounded-full shadow-2xl scale-110 sm:scale-100">
           <button 
             onClick={handlePreviousPage}
             disabled={currentPage === 1}
             className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
           </button>
           <div className="px-4 py-1.5 bg-neutral-800 text-white text-[11px] font-black rounded-full shadow-lg whitespace-nowrap">
             PAGE {currentPage} OF {totalPages || 1}
           </div>
           <button 
             onClick={handleNextPage}
             disabled={currentPage >= totalPages}
             className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
           </button>
        </div>
      )}
      {/* Footer */}
      <footer className="px-3 sm:px-4 md:px-6 text-center py-4 sm:py-6 mt-auto">
        <p className="text-xs sm:text-sm text-neutral-600">
          Copyright © 2025. Developed By{' '}
          <Link to="/seller" className="text-teal-600 hover:text-teal-700 font-semibold tracking-wide">
            JYASTI builds trust
          </Link>
        </p>
      </footer>
    </div>
  );
}


