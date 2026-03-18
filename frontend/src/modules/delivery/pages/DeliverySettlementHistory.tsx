import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const SettlementItem = ({ settlement }: { settlement: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 mb-3"
  >
    <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-50">
      <div>
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Settlement ID</p>
        <p className="font-bold text-neutral-900">{settlement.id}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Date</p>
        <p className="font-medium text-neutral-700 text-sm">{settlement.date}</p>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <span className="text-sm font-bold text-neutral-900">Success</span>
      </div>
      <p className="text-lg font-black text-neutral-900">₹{settlement.amount}</p>
    </div>
  </motion.div>
);

export default function DeliverySettlementHistory() {
  const navigate = useNavigate();
  const settlements = [
    { id: 'ST-9021', amount: 1450, date: '15 Mar 2026' },
    { id: 'ST-8842', amount: 2200, date: '12 Mar 2026' },
    { id: 'ST-7731', amount: 980, date: '10 Mar 2026' },
    { id: 'ST-5524', amount: 3540, date: '05 Mar 2026' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-neutral-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-50 rounded-full transition-colors">
          <ArrowLeftIcon className="w-6 h-6 text-neutral-900" />
        </button>
        <h1 className="text-lg font-bold text-neutral-900">Settlement History</h1>
      </div>

      <div className="p-4">
        <div className="bg-neutral-900 text-white rounded-2xl p-6 mb-8 shadow-xl">
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-1">Total Settled (Lifetime)</p>
          <h2 className="text-3xl font-black">₹ 24,170</h2>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Account in Good Standing
          </div>
        </div>

        <h3 className="font-bold text-neutral-900 mb-4 px-2">Past Settlements</h3>
        
        {settlements.map((s, idx) => (
          <SettlementItem key={idx} settlement={s} />
        ))}

        <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
          <div className="text-xl">ℹ️</div>
          <div>
            <p className="text-sm font-bold text-blue-900">Settlement Cycle</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Settlements are processed every evening after warehouse handover. For urgent queries, contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
