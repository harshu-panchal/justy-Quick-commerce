import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const TransactionRow = ({ tx, delay, onVerify }: { tx: any, delay: number, onVerify: (tx: any) => void }) => (
  <motion.tr
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors group"
  >
    <td className="py-4 px-4 font-bold text-neutral-900">{tx.orderId}</td>
    <td className="py-4 px-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-neutral-800">{tx.deliveryPartner}</span>
        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">{tx.partnerId}</span>
      </div>
    </td>
    <td className="py-4 px-4 font-bold text-neutral-900">₹{tx.amount}</td>
    <td className="py-4 px-4">
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
        tx.status === 'Received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {tx.status}
      </span>
    </td>
    <td className="py-4 px-4 text-right">
      {tx.status === 'Pending' ? (
        <button 
          onClick={() => onVerify(tx)}
          className="bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20 active:scale-95"
        >
          Verify OTP
        </button>
      ) : (
        <button className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest cursor-default">Settled</button>
      )}
    </td>
  </motion.tr>
);

export default function WarehouseCOD() {
  const [txList, setTxList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settlementTx, setSettlementTx] = useState<any>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSettlingAll, setIsSettlingAll] = useState(false);

  useEffect(() => {
    // Initial data fetch simulation
    setTimeout(() => {
      setTxList([
        { orderId: '#JS-8240', deliveryPartner: 'Rahul Sharma', partnerId: 'DP-9021', amount: 450, status: 'Received' },
        { orderId: '#JS-8239', deliveryPartner: 'Amit Kumar', partnerId: 'DP-8842', amount: 770, status: 'Pending' },
        { orderId: '#JS-8238', deliveryPartner: 'Sanjay Singh', partnerId: 'DP-7731', amount: 320, status: 'Received' },
        { orderId: '#JS-8237', deliveryPartner: 'Rahul Sharma', partnerId: 'DP-9021', amount: 780, status: 'Received' },
        { orderId: '#JS-8236', deliveryPartner: 'Vikram Batra', partnerId: 'DP-5524', amount: 150, status: 'Pending' },
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  const totalCollected = txList.filter(t => t.status === 'Received').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = txList.filter(t => t.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);

  const handleVerify = () => {
    if (enteredOtp.length !== 4) return;
    setIsVerifying(true);
    setTimeout(() => {
      setTxList(prev => prev.map(t => t.orderId === settlementTx.orderId ? { ...t, status: 'Received' } : t));
      setSettlementTx(null);
      setIsVerifying(false);
      setEnteredOtp('');
    }, 1500);
  };

  const handleSettleAll = () => {
    const pendingCount = txList.filter(t => t.status === 'Pending').length;
    if (pendingCount === 0) return;
    
    setIsSettlingAll(true);
    setTimeout(() => {
        setTxList(prev => prev.map(t => ({ ...t, status: 'Received' })));
        setIsSettlingAll(false);
        alert(`Successfully settled all ${pendingCount} pending collections!`);
    }, 2000);
  };

  const handleExportCSV = () => {
    alert('Generating CSV file for the current collection history...');
    setTimeout(() => {
        alert('CSV Exported successfully! Check your downloads.');
    }, 1000);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">COD Collections</h1>
          <p className="text-neutral-500 mt-1">Track and manage cash collections from delivery partners.</p>
        </div>
        
        <div className="flex gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-600/20 text-right min-w-[180px]"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Collected Today</p>
            <h3 className="text-2xl font-black">₹ {totalCollected.toLocaleString()}</h3>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-500 text-white p-4 rounded-2xl shadow-lg shadow-amber-500/20 text-right min-w-[180px]"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Pending Settlement</p>
            <h3 className="text-2xl font-black">₹ {totalPending.toLocaleString()}</h3>
          </motion.div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight">Recent Collections</h2>
          <div className="flex gap-3">
            <button 
                onClick={handleExportCSV}
                className="px-6 py-3 text-sm font-bold bg-neutral-50 text-neutral-600 rounded-2xl hover:bg-neutral-100 transition-all active:scale-95"
            >
                Export CSV
            </button>
            <button 
                onClick={handleSettleAll}
                disabled={isSettlingAll || totalPending === 0}
                className={`px-8 py-3 text-sm font-bold rounded-2xl transition-all active:scale-95 shadow-lg ${
                    totalPending === 0 
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none' 
                    : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/20'
                }`}
            >
                {isSettlingAll ? 'Settling All...' : 'Settle All Pending'}
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
                ) : txList.length > 0 ? (
                    txList.map((tx, index) => (
                        <TransactionRow key={tx.orderId} tx={tx} delay={index * 0.05} onVerify={setSettlementTx} />
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} className="py-20 text-center">
                            <div className="text-4xl opacity-20 mb-4">💰</div>
                            <p className="text-neutral-400 font-bold italic">No collection records found</p>
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
        {settlementTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isVerifying && setSettlementTx(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[48px] p-10 max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
              
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-orange-50 rounded-[40px] rotate-12 flex items-center justify-center mx-auto mb-6 text-5xl shadow-lg border-2 border-white">
                  <span className="-rotate-12">💰</span>
                </div>
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight leading-none">Settlement</h2>
                <p className="text-sm font-bold text-neutral-400 mt-3">Verifying cash handover from <b>{settlementTx.deliveryPartner}</b></p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-3xl border border-neutral-100 shadow-inner">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Amount to Collect</span>
                  <span className="text-3xl font-black text-orange-600">₹ {settlementTx.amount.toLocaleString()}</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-center">Ask Rider for Settlement OTP</p>
                  <input 
                    type="text" 
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="0 0 0 0"
                    disabled={isVerifying}
                    className="w-full text-center text-5xl font-black tracking-[12px] py-8 rounded-[36px] border-2 border-neutral-100 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-100 bg-neutral-50 shadow-inner"
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={enteredOtp.length !== 4 || isVerifying}
                  className={`w-full py-6 rounded-[32px] font-black text-xl transition-all shadow-xl active:scale-95 ${
                    enteredOtp.length === 4 && !isVerifying
                      ? 'bg-orange-600 text-white shadow-orange-500/30 -translate-y-1' 
                      : 'bg-neutral-100 text-neutral-300 cursor-not-allowed translate-y-0'
                  }`}
                >
                  {isVerifying ? (
                    <div className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Verifying...</span>
                    </div>
                  ) : 'Confirm Cash Deposit'}
                </button>

                <button
                  disabled={isVerifying}
                  onClick={() => setSettlementTx(null)}
                  className="w-full py-2 text-xs font-black text-neutral-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Cancel Process
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
