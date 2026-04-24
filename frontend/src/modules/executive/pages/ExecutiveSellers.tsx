import { useState, useEffect } from 'react';
import ExecutiveLayout from '../components/ExecutiveLayout';
import { getOnboardedSellers } from '../services/executiveService';
import { motion } from 'framer-motion';

export default function ExecutiveSellers() {
    const [sellers, setSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSellers = async () => {
            try {
                const data = await getOnboardedSellers();
                setSellers(data.data);
            } catch (error) {
                console.error("Error fetching sellers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSellers();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700';
            case 'Pending': return 'bg-orange-100 text-orange-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    return (
        <ExecutiveLayout title="Onboarded Sellers" showBack>
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">
                        Total {sellers.length} Sellers
                    </h2>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-neutral-100 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : sellers.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                        </div>
                        <p className="text-neutral-400 font-bold">No sellers onboarded yet.</p>
                        <button className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm">
                            Onboard Your First Seller
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sellers.map((seller, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={seller._id}
                                className="p-4 rounded-3xl bg-white border border-neutral-100 shadow-sm flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-xl font-black text-neutral-300">
                                    {seller.storeName?.charAt(0) || 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-neutral-900 truncate">{seller.storeName}</h3>
                                    <p className="text-[10px] text-neutral-400 font-bold truncate">{seller.sellerName} • {seller.mobile}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusColor(seller.status)}`}>
                                            {seller.status === 'Approved' ? 'Verified' : seller.status}
                                        </span>
                                        
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${seller.hasAddedFirstProduct ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                            {seller.hasAddedFirstProduct ? '1st Product Added' : 'No Products'}
                                        </span>

                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${seller.commissionCredited ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'}`}>
                                            {seller.commissionCredited ? 'Commission Credited' : 'Comm. Pending'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-neutral-400 font-black uppercase mb-1">Earned</div>
                                    <div className="text-sm font-black text-emerald-600">
                                        ₹{seller.commissionAmount || 0}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </ExecutiveLayout>
    );
}
