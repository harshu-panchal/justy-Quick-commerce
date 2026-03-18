import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
        <p className="font-bold text-neutral-900">Order {tx.orderId}</p>
        <p className="text-xs text-neutral-500">{tx.time}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-black text-neutral-900">₹{tx.amount}</p>
      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Collected</span>
    </div>
  </motion.div>
);

export default function DeliveryCOD() {
  const navigate = useNavigate();
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementOtp, setSettlementOtp] = useState('');

  const transactions = [
    { orderId: '#JS-8240', amount: 450, time: 'Today, 2:30 PM' },
    { orderId: '#JS-8238', amount: 320, time: 'Today, 11:15 AM' },
    { orderId: '#JS-8235', amount: 560, time: 'Yesterday, 8:45 PM' },
  ];

  const handleInitiateSettlement = () => {
    // Generate a random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setSettlementOtp(otp);
    setShowSettlementModal(true);
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
          <h2 className="text-4xl font-black">₹ 770</h2>
          <p className="text-[10px] text-emerald-200 mt-2 font-bold uppercase tracking-widest">To be settled with warehouse</p>
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-20 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-neutral-900">Recent Collections</h3>
          <button className="text-xs font-bold text-emerald-600" onClick={() => navigate('/delivery/settlement-history')}>History</button>
        </div>
        
        {transactions.map((tx, idx) => (
          <TransactionItem key={idx} tx={tx} />
        ))}

        <div className="pt-6">
          <button 
            onClick={handleInitiateSettlement}
            className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
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
                  {settlementOtp.split('').map((digit, i) => (
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
                Please ensure you hand over the exact amount (₹770) before confirming the verification.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
