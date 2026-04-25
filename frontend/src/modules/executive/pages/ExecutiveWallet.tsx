import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExecutiveLayout from '../components/ExecutiveLayout';
import { getWalletTransactions, requestWithdrawal, getDashboardStats } from '../services/executiveService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ExecutiveWallet() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, transRes] = await Promise.all([
                    getDashboardStats(),
                    getWalletTransactions()
                ]);
                setStats(statsRes.data);
                setTransactions(transRes.data);
            } catch (error: any) {
                console.error("Wallet data error:", error);
                toast.error(error.response?.data?.message || "Failed to load wallet data");
                if (error.response?.status === 401) navigate('/executive/login');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleWithdraw = async () => {
        if (!stats || stats.walletBalance <= 0) {
            toast.error('No balance available to withdraw');
            return;
        }
        // if ((stats?.onboardedSellers || 0) < 10) {
        //     toast.error('Minimum 10 sellers required to withdraw');
        //     return;
        // }

        setWithdrawing(true);
        try {
            await requestWithdrawal(stats.walletBalance);
            toast.success('Withdrawal request submitted successfully!');
            // Refresh data
            const statsRes = await getDashboardStats();
            setStats(statsRes.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Withdrawal failed');
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <ExecutiveLayout title="Wallet" showBack>
            <div className="space-y-6">
                {/* Balance Card */}
                <div className="relative overflow-hidden rounded-lg bg-white border-2 border-emerald-50 p-8 text-neutral-900 shadow-xl shadow-emerald-100/50">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-neutral-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
                        <h2 className="text-5xl font-black tracking-tighter mb-8 text-emerald-600">
                            <span className="text-2xl font-bold mr-1 opacity-50 text-neutral-400">₹</span>
                            {stats?.walletBalance || 0}
                        </h2>
                        
                        <button
                            onClick={handleWithdraw}
                            disabled={withdrawing || !stats || stats.walletBalance <= 0}
                            className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-lg font-black transition-all active:scale-95 shadow-xl shadow-neutral-200"
                        >
                            {withdrawing ? 'Processing...' : 'Request Payout'}
                        </button>
                        
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Recent Transactions</h4>
                    
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-20 bg-neutral-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-neutral-400 font-bold text-sm">No transactions found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={tx._id}
                                    className="p-4 rounded-lg bg-white border border-neutral-100 shadow-sm flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-lg ${tx.type === 'Credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-50 text-neutral-600'}`}>
                                            {tx.type === 'Credit' ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M12 5v14M5 12l7 7 7-7" />
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M12 19V5M5 12l7-7 7 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-neutral-900">{tx.description}</p>
                                            <p className="text-[10px] text-neutral-400 font-bold">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-black ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-neutral-900'}`}>
                                        {tx.type === 'Credit' ? '+' : '-'} ₹{tx.amount}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ExecutiveLayout>
    );
}
