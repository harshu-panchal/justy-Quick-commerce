import React, { useState, useEffect } from 'react';
import { 
    getSellerWalletBalance, 
    getSellerWalletTransactions,
    requestSellerWithdrawal 
} from '../../../services/api/sellerWalletService';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export default function SellerFinance() {
    const [balanceData, setBalanceData] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        grossSales: 0,
        deductions: 0
    });
    
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [balanceRes, historyRes] = await Promise.all([
                getSellerWalletBalance(),
                getSellerWalletTransactions(1, 5) // Show 5 per page
            ]);

            if (balanceRes.success) {
                setBalanceData(balanceRes.data);
            }

            if (historyRes.success) {
                const txns = historyRes.data.transactions || [];
                setTransactions(txns);
                setHasMore(txns.length >= 5);

                // Calculate gross sales and deductions using a separate call or large fetch for stats
                const allTxnsRes = await getSellerWalletTransactions(1, 1000);
                if (allTxnsRes.success) {
                    let gross = 0;
                    let deduct = 0;
                    allTxnsRes.data.transactions?.forEach((t: any) => {
                        if (t.type === 'Credit') gross += t.amount;
                        if (t.type === 'Debit') deduct += t.amount;
                    });
                    setStats({ grossSales: gross, deductions: deduct });
                }
            }
        } catch (error) {
            console.error("Finance fetch error:", error);
            toast.error("Failed to sync financial records.");
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePDF = () => {
        try {
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString();
            
            // Header
            doc.setFontSize(22);
            doc.setTextColor(13, 148, 136); // Teal 600
            doc.text("FINANCIAL SETTLEMENT REPORT", 20, 30);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${timestamp}`, 20, 40);
            doc.text(`Merchant Registry: ${(balanceData?._id || 'N/A').toUpperCase()}`, 20, 46);
            
            // Stats
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Available Balance: INR ${balanceData?.salesBalance || 0}`, 20, 60);
            doc.text(`Gross Revenue: INR ${stats.grossSales}`, 20, 68);
            
            // Table Header
            doc.setFillColor(245, 245, 245);
            doc.rect(20, 80, 170, 10, 'F');
            doc.setFontSize(10);
            doc.text("DATE", 25, 87);
            doc.text("DESCRIPTION", 60, 87);
            doc.text("REFERENCE", 120, 87);
            doc.text("AMOUNT", 160, 87);
            
            // Table Body
            let y = 100;
            transactions.forEach((txn, i) => {
                if (y > 270) {
                    doc.addPage();
                    y = 30;
                }
                const date = formatDate(txn.createdAt);
                doc.text(date, 25, y);
                doc.text(txn.reason?.substring(0, 25) || "N/A", 60, y);
                doc.text((txn._id || '').slice(-8).toUpperCase(), 120, y);
                doc.text(`${txn.type === 'Credit' ? '+' : '-'}${txn.amount}`, 160, y);
                y += 10;
                doc.setDrawColor(240);
                doc.line(20, y - 5, 190, y - 5);
            });
            
            doc.save(`Financial_Report_${Date.now()}.pdf`);
            toast.success("Audit PDF Encoded and Downloaded.");
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error("Failed to compile financial report.");
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(withdrawAmount);
        
        if (!amt || amt <= 0) return toast.error("Enter a valid MAGNITUDE for payout.");
        if (amt > (balanceData?.salesBalance || 0)) return toast.error("Insufficient Treasury Funds.");

        setWithdrawing(true);
        try {
            const res = await requestSellerWithdrawal(amt, 'Bank Transfer');
            if (res.success) {
                toast.success('Withdrawal Request Transmitted.');
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                fetchFinanceData(); // Refresh balance
            }
        } catch (error: any) {
            toast.error(error.message || 'Payout Transmission Failed.');
        } finally {
            setWithdrawing(false);
        }
    };

    const loadMore = async () => {
        const nextPage = page + 1;
        try {
            const res = await getSellerWalletTransactions(nextPage, 5);
            if (res.success) {
                const newTxns = res.data.transactions || [];
                if (newTxns.length === 0) setHasMore(false);
                setTransactions([...transactions, ...newTxns]);
                setPage(nextPage);
            }
        } catch (error) {
            toast.error("Failure to retrieve subsequent records.");
        }
    };

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amt || 0);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Decrypting Ledger...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Balance Summary Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-8 rounded-2xl text-white shadow-2xl shadow-slate-900/20 border border-slate-800 relative overflow-hidden group">
                {/* Abstract UI Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-teal-500/20"></div>
                
                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h1 className="text-xs font-black tracking-[0.2em] uppercase text-teal-400">FINANCE CORE</h1>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight leading-none text-white">Merchant Treasury</h2>
                    <p className="text-slate-400 text-[11px] font-medium max-w-[280px] leading-relaxed">System-wide settlement reporting and direct payout management.</p>
                </div>
                
                <div className="text-right space-y-1 relative z-10 w-full md:w-auto mt-4 md:mt-0">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1 leading-none">VIRTUAL WALLET BALANCE</p>
                    <div className="text-5xl font-black tracking-tighter leading-none text-white mb-6 tabular-nums">
                        {formatCurrency(balanceData?.salesBalance || 0)}<span className="text-lg text-slate-500 font-bold">.00</span>
                    </div>
                    <button 
                        onClick={() => setShowWithdrawModal(true)}
                        className="px-10 py-4 bg-teal-600 text-white font-black text-[10px] rounded-xl hover:bg-teal-500 transition-all shadow-xl shadow-teal-600/20 active:scale-95 uppercase tracking-[0.2em]"
                    >
                        EXECUTE PAYOUT
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-5 group transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💸</div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none">Gross Credit Flow</p>
                        <h3 className="text-xl font-black text-neutral-900 leading-none tabular-nums">{formatCurrency(stats.grossSales)}</h3>
                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-tight">Lifetime Revenue</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-5 group transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📉</div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none">Deductions/Debits</p>
                        <h3 className="text-xl font-black text-neutral-900 leading-none tabular-nums">{formatCurrency(stats.deductions)}</h3>
                        <p className="text-[8px] font-bold text-rose-500 uppercase tracking-tight">System Outflow</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-5 group transition-all hover:shadow-md">
                    <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🔒</div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none">Escrow/Deposit</p>
                        <h3 className="text-xl font-black text-neutral-900 leading-none tabular-nums">{formatCurrency(balanceData?.securityDepositBalance)}</h3>
                        <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-tight">System Security</p>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100">
                <div className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-50">
                    <div className="space-y-1">
                        <h2 className="text-sm font-black text-neutral-900 tracking-tight uppercase">TRANSACTION LEDGER</h2>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Real-time audit of all wallet movements</p>
                    </div>
                    <button 
                        onClick={handleGeneratePDF}
                        className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 shadow-lg shadow-black/10 active:scale-95"
                    >
                        <span className="text-sm">📥</span> 
                        GENERATE AUDIT PDF
                    </button>
                </div>
                
                <div className="w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50">
                                <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">TIMESTAMP</th>
                                <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">REFERENCE</th>
                                <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">DESCRIPTION</th>
                                <th className="px-8 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest text-right">MAGNITUDE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <span className="text-4xl">🌫️</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest">No wallet activity recorded yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn, index) => (
                                    <tr key={txn._id || index} className="hover:bg-neutral-50/80 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="text-[11px] font-black text-neutral-900 tabular-nums">{formatDate(txn.createdAt)}</p>
                                            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-[10px] font-black text-neutral-400 group-hover:text-teal-600 transition-colors">{(txn._id || 'TXN-0').slice(-10).toUpperCase()}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                                                    txn.type === 'Credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {txn.type === 'Credit' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-neutral-900 uppercase leading-none">{txn.reason}</p>
                                                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight mt-1">{txn.note || (txn.type === 'Credit' ? 'Order Earnings' : 'Payout Settlement')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black tabular-nums transition-all ${
                                            txn.type === 'Credit' ? 'text-emerald-600 group-hover:scale-105' : 'text-neutral-900'
                                        }`}>
                                            {txn.type === 'Credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {hasMore && transactions.length > 0 && (
                    <div className="p-6 bg-white border-t border-neutral-50 text-center">
                        <button 
                            onClick={loadMore}
                            className="text-[10px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <span>REVEAL ADDITIONAL RECORDS</span>
                            <span className="text-lg">↓</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Withdrawal Modal */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowWithdrawModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-neutral-100"
                        >
                            <div className="bg-slate-900 p-8 text-white relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl -mr-16 -mt-16" />
                                <h3 className="text-xl font-black tracking-tight uppercase leading-none">Payout Console</h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">TREASURY WITHDRAWAL • BANK TRANSFER</p>
                            </div>

                            <form onSubmit={handleWithdraw} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                        <span>Available Funds</span>
                                        <span className="text-teal-600">{formatCurrency(balanceData?.salesBalance || 0)}</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            required
                                            placeholder="0"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            className="w-full h-16 bg-neutral-50 border border-neutral-100 rounded-2xl px-6 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all text-neutral-900"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-neutral-400">INR</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <button 
                                        type="submit"
                                        disabled={withdrawing}
                                        className="w-full h-14 bg-teal-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-teal-500 transition-all shadow-lg shadow-teal-600/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {withdrawing ? 'Transmitting...' : 'Authorize Payout'}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setShowWithdrawModal(false)}
                                        className="w-full h-12 bg-neutral-100 text-neutral-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-200 transition-all"
                                    >
                                        Cancel Transaction
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


