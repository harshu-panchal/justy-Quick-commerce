import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const OrderItem = ({ order, delay, onHandover }: { order: any, delay: number, onHandover: (id: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ delay }}
    className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 hover:shadow-xl hover:border-orange-100 transition-all group"
  >
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
          {order.status === 'Ready' ? '🚚' : order.status === 'Shipped' ? '✅' : '📦'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-neutral-900 tracking-tight text-lg uppercase">{order.id}</h3>
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
              order.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 
              order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
              order.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
            }`}>
              {order.status}
            </span>
          </div>
          <p className="text-sm text-neutral-500 font-bold">{order.itemsCount} Items • <span className="text-orange-600">₹{order.amount}</span></p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right hidden md:block mr-2">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Status</p>
          <p className="text-xs font-bold text-neutral-700">{order.status === 'Pending' ? 'Awaiting Pack' : 'Updated 10m ago'}</p>
        </div>
        <button className="p-3 hover:bg-neutral-100 rounded-2xl transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      </div>
    </div>

    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 border-t border-dashed border-neutral-100">
      <div className="space-y-2 max-w-md">
        <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
          <span>📍 Delivery Address</span>
        </div>
        <p className="text-sm font-bold text-neutral-700 leading-relaxed">{order.location}</p>
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <button className="flex-1 md:flex-none px-6 py-3 text-sm font-black text-neutral-600 hover:bg-neutral-100 rounded-2xl transition-all active:scale-95">
          Order Info
        </button>
        {order.status === 'Ready' ? (
          <button 
            onClick={() => onHandover(order.id)}
            className="flex-1 md:flex-none px-8 py-3 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
          >
            Handover to Rider
          </button>
        ) : order.status === 'Shipped' ? (
            <button className="flex-1 md:flex-none px-8 py-3 text-sm font-black text-neutral-400 bg-neutral-100 rounded-2xl cursor-default uppercase">
                Handed Over
            </button>
        ) : (
          <button className="flex-1 md:flex-none px-8 py-3 text-sm font-black text-white bg-orange-600 hover:bg-orange-700 rounded-2xl shadow-xl shadow-orange-600/30 active:scale-95 transition-all">
            Pack Order
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

export default function WarehouseOrders() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [handoverOrderId, setHandoverOrderId] = useState<string | null>(null);
  const [riderOtp, setRiderOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const rawOrders = [
    { id: '#JS-8241', itemsCount: 3, amount: 450, location: 'Building 4, Flat 201, Jubilee Hills', status: 'Pending' },
    { id: '#JS-8242', itemsCount: 1, amount: 120, location: 'Highline Apts, Sector 45', status: 'Ready' },
    { id: '#JS-8243', itemsCount: 5, amount: 1250, location: 'Villa 12, Palm Grove', status: 'Pending' },
    { id: '#JS-8244', itemsCount: 2, amount: 320, location: 'Banjara Hills, Road No 12', status: 'Pending' },
    { id: '#JS-8245', itemsCount: 4, amount: 980, location: 'Gachibowli, DLF Cyber City', status: 'Ready' },
    { id: '#JS-8246', itemsCount: 2, amount: 210, location: 'Hitech City, Madhapur', status: 'Shipped' },
  ];

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = () => {
    setIsLoading(true);
    setTimeout(() => {
        let filtered = rawOrders;
        if (filter !== 'All') {
            filtered = rawOrders.filter(o => o.status === filter);
        }
        setOrderList(filtered);
        setIsLoading(false);
    }, 800);
  };

  const handleHandover = (id: string) => {
    setHandoverOrderId(id);
    setRiderOtp('');
  };

  const verifyHandover = () => {
    if (riderOtp.length !== 4) return;
    setVerifying(true);
    setTimeout(() => {
      // Success feedback
      setOrderList(prev => prev.map(o => o.id === handoverOrderId ? {...o, status: 'Shipped'} : o));
      setHandoverOrderId(null);
      setVerifying(false);
      setRiderOtp('');
      alert(`Handover Successful! Order has been moved to Shipped.`);
    }, 1500);
  };

  const categories = ['All', 'Pending', 'Ready', 'Shipped'];
  
  const filteredDisplayOrders = orderList.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    o.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Order Fulfillment</h1>
          <p className="text-neutral-500 mt-1 font-medium">Manage and track warehouse order processing.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 md:max-w-2xl justify-end">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="Search Order ID or Location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border-2 border-neutral-100 focus:border-orange-500 rounded-2xl py-3 px-12 font-bold outline-none transition-all shadow-sm"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none text-lg">🔍</span>
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 bg-neutral-100 hover:bg-neutral-200 p-1 rounded-full text-[10px] text-neutral-500 transition-colors">✕</button>
                )}
            </div>

            <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-x-auto">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-6 py-2 text-xs font-black rounded-xl transition-all flex-shrink-0 ${
                            filter === cat ? 'bg-orange-600 text-white shadow-lg' : 'text-neutral-500 hover:bg-neutral-50'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
            {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                    <div key={`shimmer-${i}`} className="bg-white rounded-[32px] p-8 border border-neutral-100 animate-pulse space-y-6">
                        <div className="flex justify-between items-start">
                             <div className="flex gap-4">
                                <div className="w-14 h-14 bg-neutral-100 rounded-2xl" />
                                <div className="space-y-3">
                                    <div className="h-5 w-32 bg-neutral-100 rounded-lg" />
                                    <div className="h-4 w-48 bg-neutral-50 rounded-lg" />
                                </div>
                             </div>
                             <div className="h-8 w-20 bg-neutral-100 rounded-full" />
                        </div>
                        <div className="h-1 bg-neutral-50 w-full rounded" />
                        <div className="flex justify-between items-end">
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-neutral-50 rounded" />
                                <div className="h-4 w-64 bg-neutral-100 rounded-lg" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-12 w-24 bg-neutral-50 rounded-2xl" />
                                <div className="h-12 w-32 bg-neutral-100 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                ))
            ) : filteredDisplayOrders.length > 0 ? (
                filteredDisplayOrders.map((order, index) => (
                    <OrderItem 
                      key={order.id} 
                      order={order} 
                      delay={index * 0.05} 
                      onHandover={handleHandover}
                    />
                ))
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 text-center space-y-4"
                >
                    <div className="text-6xl text-neutral-200">🔎</div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-neutral-800 tracking-tight">No orders found</h3>
                        <p className="text-neutral-500 font-medium italic">Try adjusting your filters or search term</p>
                    </div>
                    <button onClick={() => { setFilter('All'); setSearch(''); }} className="px-6 py-2 bg-neutral-900 text-white rounded-xl text-sm font-bold active:scale-95 transition-all">Clear All</button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Handover Modal */}
      <AnimatePresence>
        {handoverOrderId && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => !verifying && setHandoverOrderId(null)}
            />
            <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                className="relative bg-white rounded-t-[48px] md:rounded-[48px] p-10 max-w-sm w-full shadow-2xl overflow-hidden"
            >
                <div className="w-12 h-1.5 bg-neutral-100 rounded-full mx-auto mb-8 md:hidden" />
                
                <div className="text-center mb-10">
                <div className="w-24 h-24 bg-emerald-50 rounded-[40px] rotate-12 flex items-center justify-center mx-auto mb-6 text-5xl shadow-lg border-2 border-white">
                    <span className="-rotate-12">📦</span>
                </div>
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight leading-none">Rider Handover</h2>
                <p className="text-sm font-bold text-neutral-400 mt-3 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Secure Verification: {handoverOrderId}
                </p>
                </div>

                <div className="space-y-6">
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-center">Ask Rider for OTP</p>
                    <input 
                        type="text" 
                        maxLength={4}
                        value={riderOtp}
                        onChange={(e) => setRiderOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="0 0 0 0"
                        disabled={verifying}
                        className="w-full text-center text-5xl font-black tracking-[12px] py-8 rounded-[32px] border-2 border-neutral-100 focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-100 bg-neutral-50 shadow-inner"
                    />
                </div>
                
                <button 
                    onClick={verifyHandover}
                    disabled={riderOtp.length !== 4 || verifying}
                    className={`w-full py-6 rounded-[32px] font-black text-xl transition-all shadow-xl active:scale-95 ${
                    riderOtp.length === 4 && !verifying
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30 -translate-y-1' 
                        : 'bg-neutral-100 text-neutral-300 cursor-not-allowed translate-y-0'
                    }`}
                >
                    {verifying ? (
                        <div className="flex items-center justify-center gap-2">
                             <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             <span>Authenticating...</span>
                        </div>
                    ) : 'Validate Handover'}
                </button>
                
                <button 
                    onClick={() => !verifying && setHandoverOrderId(null)}
                    disabled={verifying}
                    className="w-full py-2 text-xs font-black text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                    Dismiss Process
                </button>
                </div>
                
                <p className="text-center text-[9px] font-bold text-neutral-300 mt-10 leading-relaxed uppercase tracking-tighter">
                    Security ID: JS_WH_P_642 • Quick Commerce Logistics
                </p>
            </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
