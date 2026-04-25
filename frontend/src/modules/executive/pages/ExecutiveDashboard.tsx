import { useState, useEffect } from 'react';
import ExecutiveLayout from '../components/ExecutiveLayout';
import ReferralCodeCard from '../components/ReferralCodeCard';
import { getDashboardStats } from '../services/executiveService';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ExecutiveDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data.data);
            } catch (error: any) {
                console.error("Dashboard error:", error);
                const status = error.response?.status;
                const message = error.response?.data?.message || "";
                
                if (status === 403 || message.toLowerCase().includes('suspended')) {
                    toast.error(message || "Account suspended");
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("userData");
                    window.location.href = "/executive/login";
                } else if (status === 401) {
                    navigate('/executive/login');
                } else {
                    toast.error(message || "Failed to load dashboard. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <ExecutiveLayout title="Dashboard">
                <div className="space-y-6 animate-pulse">
                    <div className="h-44 bg-neutral-200 rounded-lg" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-28 bg-neutral-200 rounded-lg" />
                        <div className="h-28 bg-neutral-200 rounded-lg" />
                    </div>
                </div>
            </ExecutiveLayout>
        );
    }

    return (
        <ExecutiveLayout title="Dashboard">
            <div className="space-y-6">
                {/* KYC Banner */}
                {stats?.kycStatus === 'Approved' ? (
                    stats?.kycVerifiedAt && (Date.now() - new Date(stats.kycVerifiedAt).getTime() < 24 * 60 * 60 * 1000) ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-3"
                        >
                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-black text-emerald-900">Account Approved</p>
                                <p className="text-xs text-emerald-700/80 font-medium">Your KYC is verified. You can now request payouts.</p>
                            </div>
                        </motion.div>
                    ) : null
                ) : stats?.kycStatus === 'Submitted' ? (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3"
                    >
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-black text-blue-900">Document Submitted</p>
                            <p className="text-xs text-blue-700/80 font-medium">Your verification is pending. Admin will review your documents soon.</p>
                        </div>
                    </motion.div>
                ) : stats?.kycStatus === 'Rejected' ? (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3"
                    >
                        <div className="p-2 rounded-lg bg-red-100 text-red-600">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-black text-red-900">KYC Rejected</p>
                            <p className="text-xs text-red-700/80 font-medium">Reason: {stats?.rejectionReason || 'Documents invalid. Please re-upload.'}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-lg bg-orange-50 border border-orange-100 flex items-start gap-3"
                    >
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-black text-orange-900">Complete your KYC</p>
                            <p className="text-xs text-orange-700/80 font-medium">Please upload your documents to be eligible for withdrawals.</p>
                        </div>
                    </motion.div>
                )}

                {/* Referral Card */}
                <ReferralCodeCard code={stats?.referralCode || JSON.parse(localStorage.getItem('userData') || '{}').referralCode} />

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-lg bg-white border border-neutral-200 shadow-sm">
                        <div className="p-2.5 w-fit rounded-lg bg-blue-50 text-blue-600 mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Sellers</p>
                        <h3 className="text-2xl font-black text-neutral-900">{stats?.onboardedSellers || 0}</h3>
                    </div>

                    <div className="p-5 rounded-lg bg-white border border-neutral-200 shadow-sm">
                        <div className="p-2.5 w-fit rounded-lg bg-purple-50 text-purple-600 mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Wallet</p>
                        <h3 className="text-2xl font-black text-neutral-900">₹{stats?.walletBalance || 0}</h3>
                    </div>
                </div>

                {/* Granular Seller Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 shadow-sm flex flex-col items-center text-center">
                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-tight mb-1">Pending Verify</p>
                        <h4 className="text-xl font-black text-orange-600">{stats?.pendingVerification || 0}</h4>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 shadow-sm flex flex-col items-center text-center">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-tight mb-1">Paid Sellers</p>
                        <h4 className="text-xl font-black text-blue-600">{stats?.paidSellers || 0}</h4>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm flex flex-col items-center text-center">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-tight mb-1">Commissioned</p>
                        <h4 className="text-xl font-black text-emerald-600">{stats?.commissionedSellers || 0}</h4>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="p-6 rounded-lg bg-white border border-neutral-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-black text-neutral-900">Withdrawal Eligibility</h4>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                                {(stats?.onboardedSellers || 0) >= 10 ? 'Eligible' : `${10 - (stats?.onboardedSellers || 0)} more to go`}
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="h-3 w-full bg-neutral-100 rounded-lg overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(((stats?.onboardedSellers || 0) / 10) * 100, 100)}%` }}
                                    className="h-full bg-emerald-500 rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                                <span>{stats?.onboardedSellers || 0} Onboarded</span>
                                <span>Target: 10 Sellers</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <a 
                            href={`/seller/signup?ref=${stats?.referralCode}`}
                            className="p-4 rounded-lg bg-neutral-900 text-white flex flex-col items-center gap-2 hover:bg-neutral-800 transition-colors active:scale-95 w-full text-center"
                        >
                            <div className="p-2 rounded-lg bg-white/10">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>
                            <span className="text-[11px] font-bold">Onboard Seller</span>
                        </a>
                        <Link 
                            to="/executive/wallet" 
                            className="p-4 rounded-lg bg-white border border-neutral-200 text-neutral-900 flex flex-col items-center gap-2 hover:bg-neutral-50 transition-colors active:scale-95 shadow-sm w-full text-center"
                        >
                            <div className="p-2 rounded-lg bg-neutral-50">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            </div>
                            <span className="text-[11px] font-bold">Request Payout</span>
                        </Link>
                    </div>
                </div>
            </div>
        </ExecutiveLayout>
    );
}
