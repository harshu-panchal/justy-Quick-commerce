import React, { useEffect, useState } from 'react';
import { getGeneralAnalytics } from '../../../services/api/reportService';
import toast from 'react-hot-toast';

interface Metric {
    label: string;
    value: string;
    desc: string;
    icon: string;
}

interface AnalyticsData {
    metrics: Metric[];
    salesTrends: number[];
    weekTotal: number;
    peakHour: string;
    growth: string;
    topRevenueItem: string;
}

export default function SellerGeneralReports() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await getGeneralAnalytics();
                if (response.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
                toast.error("Analytics synchronization failed");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase leading-none">BUSINESS ANALYTICS</h1>
                    <p className="text-neutral-500 font-bold text-sm">Deep dive into your store's performance with data-driven insights.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-neutral-100 text-neutral-800 font-black text-[10px] rounded-lg hover:bg-neutral-200 transition-all shadow-sm active:scale-95 uppercase tracking-widest border border-neutral-200">
                        PDF
                    </button>
                    <button className="px-6 py-2.5 bg-teal-600 text-white font-black text-[10px] rounded-lg hover:bg-teal-700 transition-all shadow-md active:scale-95 uppercase tracking-widest">
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data?.metrics.map((metric, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow group">
                        <div className="w-16 h-16 bg-neutral-50 rounded-xl flex items-center justify-center text-3xl group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:rotate-12 shadow-inner border border-neutral-100">
                            {metric.icon}
                        </div>
                        
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{metric.label}</p>
                            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight leading-none">{metric.value}</h3>
                        </div>
                        
                        <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-wider leading-relaxed px-2">{metric.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 space-y-8 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase">SALES TRENDS (LAST 7 DAYS)</h2>
                    <div className="flex bg-neutral-100 p-1 rounded-lg items-center divide-x divide-neutral-200 border border-neutral-200">
                        <button className="px-3 py-1.5 bg-white text-neutral-800 text-[10px] font-black rounded shadow-sm uppercase tracking-widest">DAILY</button>
                    </div>
                </div>
                
                <div className="h-48 flex items-end gap-3 px-4 relative z-10 group/grid">
                    {data?.salesTrends.map((val, i) => {
                        const max = Math.max(...data.salesTrends, 1);
                        const h = (val / max) * 100;
                        return (
                            <div key={i} className="flex-1 bg-neutral-50 rounded-t relative transition-all duration-300 hover:bg-teal-50 group/bar">
                                <div 
                                    className="absolute bottom-0 left-0 w-full bg-teal-600/20 rounded-t transition-all duration-1000 delay-150 ease-out group-hover/bar:bg-teal-600 group-hover/bar:h-full shadow-teal-100"
                                    style={{ height: `${h}%` }}
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-teal-600 opacity-0 group-hover/bar:opacity-100 whitespace-nowrap">
                                    ₹{val}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-neutral-50 relative z-10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">WEEK TOTAL</p>
                        <p className="text-xl font-black text-neutral-900 leading-none group-hover:text-teal-600 transition-colors">₹{data?.weekTotal.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">PEAK HOUR</p>
                        <p className="text-xl font-black text-neutral-900 leading-none uppercase">{data?.peakHour}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">GROWTH</p>
                        <p className="text-xl font-black text-green-600 leading-none origin-left group-hover:scale-105 transition-transform">{data?.growth}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">TOP REVENUE</p>
                        <p className="text-xl font-black text-neutral-900 leading-none uppercase truncate">{data?.topRevenueItem}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
