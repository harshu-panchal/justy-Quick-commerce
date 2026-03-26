import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getUnsettledCODOrders, verifyOrderSettlement, Order } from '../../../services/api/admin/adminOrderService';

const TransactionRow = ({ order, delay, onVerify }: { order: Order, delay: number, onVerify: (order: Order) => void }) => (
  <motion.tr
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors group"
  >
    <td className="py-4 px-8 font-bold text-neutral-900 uppercase">{order._id.slice(-6)}</td>
    <td className="py-4 px-8">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-neutral-800">
          {(order.deliveryBoy as any)?.name || 'Unknown Rider'}
        </span>
        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
          {(order.deliveryBoy as any)?.mobile || 'N/A'}
        </span>
      </div>
    </td>
    <td className="py-4 px-8 font-bold text-neutral-900">₹{order.total.toFixed(2)}</td>
    <td className="py-4 px-8">
      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
        {order.status}
      </span>
    </td>
    <td className="py-4 px-8 text-right">
      <button
        onClick={() => onVerify(order)}
        className="bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20 active:scale-95"
      >
        Verify OTP
      </button>
    </td>
  </motion.tr>
);

export default function WarehouseCOD() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settlementOrder, setSettlementOrder] = useState<Order | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await getUnsettledCODOrders();
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch unsettled COD orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (enteredOtp.length !== 4 || !settlementOrder) return;
    setIsVerifying(true);
    try {
      const response = await verifyOrderSettlement(settlementOrder._id, enteredOtp);
      if (response.success) {
        alert('Deposit confirmed successfully!');
        setSettlementOrder(null);
        setEnteredOtp('');
        fetchOrders(); // Refresh list
      } else {
        alert(response.message || 'OTP verification failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const totalCollectedNow = orders.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight uppercase">COD Collections</h1>
          <p className="text-neutral-500 mt-1 font-medium">Verify cash deposits from delivery partners to clear records.</p>
        </div>

        <div className="flex gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500 text-white p-5 rounded-3xl shadow-lg shadow-amber-500/20 text-right min-w-[220px]"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total pending cash</p>
            <h3 className="text-3xl font-black">₹ {totalCollectedNow.toLocaleString()}</h3>
          </motion.div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            Unsettled Orders
          </h2>
          <div className="flex gap-3">
            <button
              onClick={fetchOrders}
              className="px-6 py-3 text-sm font-bold bg-neutral-50 text-neutral-600 rounded-2xl hover:bg-neutral-100 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50">
                <th className="py-5 px-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100">Order ID</th>
                <th className="py-5 px-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100">Delivery Partner</th>
                <th className="py-5 px-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100">Amount</th>
                <th className="py-5 px-8 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100">Status</th>
                <th className="py-5 px-8 text-right text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={`shimmer-${i}`} className="animate-pulse">
                      <td colSpan={5} className="p-4"><div className="h-10 bg-neutral-50 rounded-xl" /></td>
                    </tr>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order, index) => (
                    <TransactionRow key={order._id} order={order} delay={index * 0.05} onVerify={setSettlementOrder} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="text-5xl opacity-20 mb-4">✨</div>
                      <p className="text-neutral-400 font-bold italic">All cash has been settled. Good job!</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {settlementOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isVerifying && setSettlementOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[48px] p-10 max-w-md w-full shadow-2xl overflow-hidden mt-[-10vh]"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-teal-600" />

              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-teal-50 rounded-[40px] rotate-12 flex items-center justify-center mx-auto mb-6 text-5xl shadow-lg border-2 border-white">
                  <span className="-rotate-12">💰</span>
                </div>
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight leading-none uppercase">Warehouse Settlement</h2>
                <p className="text-sm font-bold text-neutral-400 mt-4 leading-relaxed">
                  Verifying cash deposit for order <b className="text-neutral-800 uppercase">#{settlementOrder._id.slice(-6)}</b> from <b>{(settlementOrder.deliveryBoy as any)?.name}</b>
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-3xl border border-neutral-100 shadow-inner">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Amount Expected</span>
                  <span className="text-3xl font-black text-teal-600">₹ {settlementOrder.total.toFixed(2)}</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-center">Ask Rider for 4-digit Settlement OTP</p>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="    "
                    disabled={isVerifying}
                    className="w-full text-center text-4xl font-black tracking-[16px] py-8 rounded-[36px] border-2 border-neutral-100 focus:border-teal-500 outline-none transition-all placeholder:text-neutral-100 bg-neutral-50 shadow-inner"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={enteredOtp.length !== 4 || isVerifying}
                  className={`w-full py-6 rounded-[32px] font-black text-xl transition-all shadow-xl active:scale-95 ${enteredOtp.length === 4 && !isVerifying
                      ? 'bg-teal-600 text-white shadow-teal-500/30 -translate-y-1'
                      : 'bg-neutral-100 text-neutral-300 cursor-not-allowed translate-y-0'
                    }`}
                >
                  {isVerifying ? (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>CONFIRMING...</span>
                    </div>
                  ) : 'CONFIRM CASH DEPOSIT'}
                </button>

                <button
                  disabled={isVerifying}
                  onClick={() => setSettlementOrder(null)}
                  className="w-full py-2 text-xs font-black text-neutral-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Dismiss Process
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
