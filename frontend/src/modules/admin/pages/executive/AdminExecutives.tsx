import { useState, useEffect } from 'react';
import { getExecutives, updateExecutive } from '../../services/adminExecutiveService';
import toast from 'react-hot-toast';

export default function AdminExecutives() {
    const [executives, setExecutives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ search: '', status: '' });

    const fetchExecutives = async () => {
        setLoading(true);
        try {
            const data = await getExecutives(filter);
            setExecutives(data.data);
        } catch (error) {
            toast.error('Failed to fetch executives');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExecutives();
    }, [filter]);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await updateExecutive(id, { status });
            toast.success(`Executive marked as ${status}`);
            fetchExecutives();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleKYCUpdate = async (id: string, kycStatus: string) => {
        try {
            await updateExecutive(id, { kycStatus });
            toast.success(`KYC status updated to ${kycStatus}`);
            fetchExecutives();
        } catch (error) {
            toast.error('Failed to update KYC status');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Field Executives</h1>
                    <p className="text-neutral-500 font-medium">Manage field executives and their onboarding performance</p>
                </div>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        placeholder="Search name, mobile..." 
                        className="px-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={filter.search}
                        onChange={(e) => setFilter({...filter, search: e.target.value})}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50/50 border-b border-neutral-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Executive</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Referral Code</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Performance</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">KYC Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Account Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-neutral-400 font-bold">Loading executives...</td>
                            </tr>
                        ) : executives.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-neutral-400 font-bold">No executives found</td>
                            </tr>
                        ) : (
                            executives.map((exec) => (
                                <tr key={exec._id} className="hover:bg-neutral-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-black text-neutral-900">{exec.name}</p>
                                            <p className="text-xs text-neutral-400 font-bold">{exec.mobile}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-neutral-100 rounded-lg text-xs font-black text-neutral-600">
                                            {exec.referralCode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-black text-neutral-900">{exec.sellerCount} Sellers</p>
                                            <p className="text-xs font-bold text-emerald-600">₹{exec.walletBalance} Wallet</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-2 py-0.5 w-fit rounded-full text-[9px] font-black uppercase ${
                                                exec.kycStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                exec.kycStatus === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {exec.kycStatus || 'Not Started'}
                                            </span>
                                            {exec.kycStatus === 'Pending' && (
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => handleKYCUpdate(exec._id, 'Approved')}
                                                        className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black hover:bg-emerald-700"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleKYCUpdate(exec._id, 'Rejected')}
                                                        className="px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-black hover:bg-red-700"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                            exec.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {exec.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {exec.status === 'Active' ? (
                                                <button 
                                                    onClick={() => handleStatusUpdate(exec._id, 'Suspended')}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Suspend Account"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleStatusUpdate(exec._id, 'Active')}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                                    title="Activate Account"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
