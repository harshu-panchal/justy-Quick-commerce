import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCoins } from '../../../context/CoinContext';
import { getTheme } from '../../../utils/themes';

const CoinsPage: React.FC = () => {
  const { totalCoins, transactions } = useCoins();
  const navigate = useNavigate();
  const theme = getTheme('all');
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    return tx.type === activeTab;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div 
        className="sticky top-0 z-40 flex items-center gap-4 px-4 py-4 text-white shadow-lg"
        style={{ background: theme.headerBg || '#007fb1' }}
      >
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight">Coins & Rewards</h1>
      </div>

      <motion.div 
        className="max-w-md mx-auto p-4 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Balance Card */}
        <motion.div 
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] rounded-[32px] p-8 shadow-[0_20px_40px_rgba(16,185,129,0.3)] border-b-8 border-black/10 group"
        >
          {/* Decorative Sparkles */}
          <div className="absolute top-2 right-4 text-white/40 text-2xl group-hover:animate-ping">✨</div>
          <div className="absolute bottom-4 left-4 text-white/20 text-xl group-hover:animate-bounce">✨</div>
          
          <div className="flex flex-col items-center justify-center space-y-2">
            <span className="text-white/80 font-bold uppercase tracking-widest text-xs">Total Balance</span>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner scale-110">
                <svg viewBox="0 0 24 24" fill="#059669" className="w-8 h-8">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-6xl font-black text-white drop-shadow-lg leading-none">
                {totalCoins}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/20 mt-4">
               <span className="text-white text-xs font-bold uppercase tracking-tighter">Premium Rewards Member</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => navigate('/')} // In a real app this would open the modal or scroll to it
            className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-amber-200 transition-all active:scale-95 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl shadow-inner">🎡</div>
              <div>
                <h3 className="font-bold text-gray-800 leading-tight">Lucky Spin & Win</h3>
                <p className="text-gray-500 text-xs font-medium">Earn up to 50 coins daily!</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>
        </motion.div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-black text-xl text-gray-800 uppercase tracking-tight italic">History</h2>
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              {(['all', 'credit', 'debit'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredTransactions.length > 0 ? (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredTransactions.map((tx) => (
                  <motion.div 
                    key={tx.id}
                    layout
                    variants={itemVariants}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between group hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner ${tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                        {tx.type === 'credit' ? '🎉' : '🛍️'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{tx.message}</h4>
                        <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                          {new Date(tx.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="font-black text-lg">
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                      </span>
                      <span className="text-xs ml-0.5">🪙</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 px-10 text-center"
              >
                <div className="text-6xl mb-4 grayscale opacity-20">🪙</div>
                <h3 className="font-bold text-gray-400 uppercase tracking-widest text-sm">No Rewards Yet</h3>
                <p className="text-gray-300 text-xs mt-1">Spin the wheel and start winning!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Persistent Bottom Hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl z-50 pointer-events-none">
        <span className="text-white text-[10px] font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
           More rewards coming soon! <span className="text-amber-400">⚡</span>
        </span>
      </div>
    </div>
  );
};

export default CoinsPage;
