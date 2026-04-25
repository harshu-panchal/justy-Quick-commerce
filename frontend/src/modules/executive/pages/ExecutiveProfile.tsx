import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ExecutiveLayout from '../components/ExecutiveLayout';
import { getDashboardStats, updateKYC, updateProfile } from '../services/executiveService';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../services/api/config';

export default function ExecutiveProfile() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        email: '',
        alternateMobile: ''
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data.data);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();

        if (user) {
            setEditData({
                name: user.name || '',
                email: user.email || '',
                alternateMobile: (user as any).alternateMobile || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(editData);
            toast.success('Profile updated successfully');
            setIsEditing(false);
            const data = await getDashboardStats();
            setStats(data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ExecutiveLayout title="Profile" showBack>
            <div className="space-y-8">
                {/* User Info */}
                <div className="flex flex-col items-center text-center space-y-3 py-4 relative">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="absolute top-0 right-0 p-2 bg-neutral-100 rounded-lg text-neutral-500 hover:bg-neutral-200 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>

                    <div className="w-24 h-24 rounded-lg bg-emerald-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-emerald-100">
                        {stats?.name?.charAt(0) || user?.name?.charAt(0) || 'E'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-neutral-900">{stats?.name || user?.name}</h2>
                        <p className="text-neutral-400 font-bold text-sm">+91 {stats?.mobile || user?.mobile}</p>
                        {stats?.email && <p className="text-neutral-400 text-xs font-medium">{stats.email}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-neutral-100 rounded-lg text-[10px] font-black uppercase text-neutral-500">
                            {stats?.referralCode}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                            stats?.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {stats?.status}
                        </span>
                    </div>
                </div>

                {/* Edit Profile Modal */}
                {isEditing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-sm bg-white rounded-lg p-8 shadow-2xl space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-neutral-900 uppercase tracking-widest">Edit Profile</h3>
                                <button onClick={() => setIsEditing(false)} className="p-2 bg-neutral-50 rounded-lg text-neutral-400">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={editData.email}
                                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Alternate Mobile</label>
                                    <input
                                        type="tel"
                                        value={editData.alternateMobile}
                                        onChange={(e) => setEditData({...editData, alternateMobile: e.target.value})}
                                        placeholder="Optional"
                                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* KYC Section */}
                <div className="p-6 rounded-lg bg-white border border-neutral-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">KYC Verification</h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                            stats?.kycStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                            stats?.kycStatus === 'Pending' || stats?.kycStatus === 'Submitted' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {stats?.kycStatus || 'Not Started'}
                        </span>
                    </div>

                    {stats?.kycStatus === 'Approved' ? (
                        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                            <div className="text-emerald-600">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p className="text-xs font-bold text-emerald-900 italic">Your KYC is fully verified. You are eligible for payouts.</p>
                        </div>
                    ) : stats?.kycStatus === 'Submitted' ? (
                        <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 flex flex-col gap-2">
                            <p className="text-xs font-bold text-orange-900">KYC verification is in progress. Admin will review your documents shortly.</p>
                            <p className="text-[10px] text-orange-700 font-medium italic">Usually takes 24-48 working hours.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats?.rejectionReason && (
                                <div className="p-4 rounded-lg bg-red-50 border border-red-100 space-y-1">
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Rejection Reason</p>
                                    <p className="text-xs font-bold text-red-900 italic">"{stats.rejectionReason}"</p>
                                </div>
                            )}
                            <p className="text-xs text-neutral-500 font-medium">To start earning and withdraw your commissions, you need to complete your KYC verification.</p>
                            <Link 
                                to="/executive/kyc"
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-emerald-50"
                            >
                                {stats?.kycStatus === 'Rejected' ? 'Re-submit KYC' : 'Complete KYC Now'}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <button
                    onClick={() => {
                        logout();
                        toast.success('Logged out');
                    }}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-lg font-black text-sm hover:bg-red-100 transition-colors active:scale-95 border border-red-100"
                >
                    Logout
                </button>
            </div>
        </ExecutiveLayout>
    );
}
