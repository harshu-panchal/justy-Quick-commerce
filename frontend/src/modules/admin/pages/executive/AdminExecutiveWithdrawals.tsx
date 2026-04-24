import { useState, useEffect } from 'react';
import { getWithdrawalRequests, processWithdrawal } from '../../services/adminExecutiveService';
import toast from 'react-hot-toast';

export default function AdminExecutiveWithdrawals() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [processingData, setProcessingData] = useState({ transactionId: '', adminNote: '' });

    const fetchRequests = async () => {
        try {
            const data = await getWithdrawalRequests();
            setRequests(data.data);
        } catch (error) {
            toast.error('Failed to fetch withdrawal requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleProcess = async (status: 'Paid' | 'Rejected') => {
        if (!selectedRequest) return;

        if (status === 'Paid' && !processingData.transactionId) {
            toast.error('Please enter a Transaction ID for paid requests');
            return;
        }

        try {
            await processWithdrawal(selectedRequest._id, {
                status,
                transactionId: processingData.transactionId,
                adminNote: processingData.adminNote
            });
            toast.success(`Request marked as ${status}`);
            setSelectedRequest(null);
            setProcessingData({ transactionId: '', adminNote: '' });
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to process request');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-neutral-900">Executive Payouts</h1>
                <p className="text-neutral-500 font-medium">Review and process withdrawal requests from field executives</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Executive</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Amount (₹)</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Requested On</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-neutral-400 font-bold">Loading requests...</td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-neutral-400 font-bold">No payout requests found</td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req._id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-neutral-900">{req.executive?.name}</p>
                                            <p className="text-xs text-neutral-400 font-bold">{req.executive?.mobile}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-emerald-600 text-lg">₹{req.amount}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-neutral-600">{new Date(req.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                req.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                req.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'Pending' ? (
                                                <button 
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-black hover:bg-neutral-800 transition-all active:scale-95"
                                                >
                                                    Process
                                                </button>
                                            ) : (
                                                <div className="text-xs font-bold text-neutral-400 italic">
                                                    Processed on {new Date(req.processedAt || req.updatedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-6">
                    {selectedRequest ? (
                        <div className="bg-neutral-900 rounded-3xl p-6 text-white shadow-xl shadow-neutral-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black tracking-tight">Process Payout</h3>
                                <button onClick={() => setSelectedRequest(null)} className="text-neutral-500 hover:text-white">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-neutral-500 uppercase">Amount to Pay</span>
                                    <span className="text-xl font-black text-emerald-400">₹{selectedRequest.amount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-neutral-500 uppercase">To Executive</span>
                                    <span className="text-xs font-bold text-white">{selectedRequest.executive?.name}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Transaction ID *</label>
                                    <input 
                                        type="text"
                                        value={processingData.transactionId}
                                        onChange={(e) => setProcessingData({...processingData, transactionId: e.target.value})}
                                        className="w-full px-4 py-3 bg-white/10 rounded-2xl text-white font-black text-sm border border-white/10 focus:border-white/30 outline-none transition-all"
                                        placeholder="UTR / Ref No."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Admin Note (Optional)</label>
                                    <textarea 
                                        value={processingData.adminNote}
                                        onChange={(e) => setProcessingData({...processingData, adminNote: e.target.value})}
                                        className="w-full px-4 py-3 bg-white/10 rounded-2xl text-white font-medium text-sm border border-white/10 focus:border-white/30 outline-none transition-all h-20 resize-none"
                                        placeholder="Internal remarks..."
                                    />
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={() => handleProcess('Rejected')}
                                        className="flex-1 py-4 bg-red-600/20 text-red-500 rounded-2xl text-xs font-black hover:bg-red-600/30 transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => handleProcess('Paid')}
                                        className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        Mark as Paid
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-neutral-100 p-8 text-center shadow-sm">
                            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-black text-neutral-900 mb-2">Select a request to process</h4>
                            <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                                Once you've manually transferred the funds to the executive's bank account, enter the transaction ID here to mark it as paid.
                            </p>
                        </div>
                    )}

                    <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-black text-emerald-900">Payout Policy</h4>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-bold italic leading-relaxed">
                            Every Monday, executives who have onboarded at least 10 sellers are eligible for payouts. Requests are generated manually by executives from their portal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
