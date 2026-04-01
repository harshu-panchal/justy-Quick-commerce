import React, { useEffect, useState } from 'react';
import { getGrowthInsights } from '../../../services/api/reportService';
import toast from 'react-hot-toast';

const engineIcons: Record<string, string> = {
    'Buy 1 Get 1 Free': '🎁',
    'Flat 20% OFF': '🏷️',
    'Ad Campaign': '📣',
};

const defaultEngines = [
    { label: 'Buy 1 Get 1 Free', desc: 'Boost order volume by offering every second dish for free.', active: true },
    { label: 'Flat 20% OFF', desc: 'Attract new customers with a clear price slash.', active: false },
    { label: 'Ad Campaign', desc: 'Appear at the top of searches for 3x visibility.', active: false },
];

export default function SellerGrowth() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrowth = async () => {
            try {
                const res = await getGrowthInsights();
                if (res.success) setStats(res.data);
            } catch (e) {
                toast.error("Failed to sync growth data");
            } finally {
                setLoading(false);
            }
        };
        fetchGrowth();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* dynamic stats header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'PROMO REVENUE', val: `₹${stats?.promoRevenue.toLocaleString()}`, color: 'text-teal-600' },
                    { label: 'PROMO ORDERS', val: stats?.promoOrders, color: 'text-neutral-900' },
                    { label: 'VISIBILITY', val: stats?.visibilityScore, color: 'text-blue-600' },
                    { label: 'ACTIVE CAMPAIGNS', val: stats?.activeCampaigns, color: 'text-neutral-900' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight">GROWTH ENGINES</h2>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Active strategies to scale traffic</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {defaultEngines.map((engine, index) => (
                        <div key={index} className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col items-center text-center space-y-6 hover:shadow-md transition-all group">
                            <div className="w-20 h-20 bg-neutral-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:scale-105 shadow-inner border border-neutral-100">
                                {engineIcons[engine.label]}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight leading-none">{engine.label}</h3>
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-relaxed px-2">{engine.desc}</p>
                            </div>
                            <button className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                engine.active ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                            }`}>
                                {engine.active ? 'Disable' : 'Deploy Engine'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-neutral-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                <div className="relative z-10 space-y-8">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black uppercase tracking-tight">AI RECOMMENDATIONS</h2>
                        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">personalized strategies based on market data</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats?.recommendations.map((rec: any, i: number) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-colors cursor-pointer">
                                <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400 text-xs font-black">{rec.impact}</div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight mb-1">{rec.title}</p>
                                    <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">{rec.action}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/10 blur-[100px] -mr-32 -mt-32" />
            </div>
        </div>
    );
}
