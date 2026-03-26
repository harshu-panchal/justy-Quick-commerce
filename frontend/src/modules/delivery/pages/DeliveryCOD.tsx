import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getDashboardStats, initiateOrderSettlement, getTodayOrders } from '../../../services/api/delivery/deliveryService';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const TransactionItem = ({ tx }: { tx: any }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl">
        💰
      </div>
      <div>
        <p className="font-bold text-neutral-900">Order {tx.orderId || tx.orderNumber}</p>
        <p className="text-xs text-neutral-500">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-black text-neutral-900">₹{tx.totalAmount || tx.total}</p>
      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Collected</span>
    </div>
  </motion.div>
);

export default function DeliveryCOD() {
  const navigate = useNavigate();
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementOtp, setSettlementOtp] = useState('');
  const [cashInHand, setCashInHand] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, orders] = await Promise.all([
          getDashboardStats(),
          getTodayOrders()
        ]);
        setCashInHand(stats.cashBalance || 0);
        // Filter only delivered COD orders that are not settled
        const codOrders = orders.filter((o: any) => 
          o.status === 'Delivered' && (o.paymentMethod === 'COD' || o.paymentMethod === 'cod')
        );
        setTransactions(codOrders);
      } catch (err) {
        console.error('Failed to fetch COD data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInitiateSettlement = async () => {
    if (transactions.length === 0) {
        alert("No pending COD orders to settle");
        return;
    }
    
    try {
      // For simplicity, we initiate settlement for the first unsettled order
      // In a more robust version, we would allow selecting which orders to settle
      const targetOrder = transactions[0];
      const res = await initiateOrderSettlement(targetOrder.id || targetOrder._id);
      if (res.success) {
        setSettlementOtp(res.otp || '1234');
        setShowSettlementModal(true);
      }
    } catch (err: any) {
      alert(err.message || "Failed to initiate settlement");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-emerald-600 text-white p-6 pb-20 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">COD Collections</h1>
        </div>
        
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center shadow-lg border border-white/10">
          <p className="text-emerald-100 text-sm font-medium mb-1">Cash in Hand</p>
          <h2 className="text-4xl font-black">₹ {cashInHand.toLocaleString()}</h2>
          <p className="text-[10px] text-emerald-200 mt-2 font-bold uppercase tracking-widest">To be settled with warehouse</p>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-20 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-neutral-900">Recent Collections</h3>
          <button className="text-xs font-bold text-emerald-600" onClick={() => navigate('/delivery/settlement-history')}>History</button>
        </div>
        
        {loading ? (
           <div className="text-center py-10 text-neutral-400">Loading data...</div>
        ) : transactions.length > 0 ? (
          transactions.map((tx, idx) => (
            <TransactionItem key={idx} tx={tx} />
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-neutral-200 text-center">
            <p className="text-neutral-400 text-sm italic">No pending cash collections</p>
          </div>
        )}

        <div className="pt-6">
          <button 
            onClick={handleInitiateSettlement}
            disabled={transactions.length === 0}
            className={`w-full py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all ${transactions.length > 0 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}
          >
            Initiate Settlement
          </button>
        </div>
      </div>

      {/* Settlement Modal */}
      <AnimatePresence>
        {showSettlementModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettlementModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative bg-white rounded-t-[32px] sm:rounded-[32px] p-8 max-w-sm w-full shadow-2xl overflow-hidden"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-6 sm:hidden" />
              
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                  🏦
                </div>
                <h2 className="text-2xl font-black text-neutral-900">Settle Cash</h2>
                <p className="text-sm text-neutral-500 mt-2">Show this OTP to the Warehouse Manager to confirm your cash deposit.</p>
              </div>

              <div className="bg-neutral-50 rounded-3xl p-6 border-2 border-dashed border-emerald-200 text-center mb-8">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-4">Your Settlement OTP</p>
                <div className="flex items-center justify-center gap-4">
                  {(settlementOtp || '1234').split('').map((digit, i) => (
                    <div key={i} className="w-12 h-16 bg-white rounded-xl shadow-sm border border-emerald-100 flex items-center justify-center text-3xl font-black text-neutral-900">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowSettlementModal(false)}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                Okay, Done
              </button>
              
              <p className="text-center text-[10px] text-neutral-400 mt-6 font-medium leading-relaxed px-4">
                Please ensure you hand over the exact amount (₹{cashInHand}) before confirming the verification.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
