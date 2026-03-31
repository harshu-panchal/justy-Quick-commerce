import React, { useEffect, useState } from 'react';
import { getReturnRequests, updateReturnStatus, ReturnRequest } from '../../../services/api/seller/returnService';
import { getSellerComplaints, updateComplaintStatus, ComplaintEntry } from '../../../services/api/seller/complaintService';
import { useToast } from '../../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'Returns' | 'Tickets';

export default function SellerComplaints() {
    const [activeTab, setActiveTab] = useState<TabType>('Returns');
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [tickets, setTickets] = useState<ComplaintEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All Status');
    const { showToast } = useToast();
    const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<ComplaintEntry | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'Returns') {
                const response = await getReturnRequests(filter === 'All Status' ? undefined : filter);
                if (response.success) setReturns(response.data);
            } else {
                const response = await getSellerComplaints(filter === 'All Status' ? undefined : filter);
                if (response.success) setTickets(response.data.complaints);
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
            showToast('Failed to load complaints', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter, activeTab]);

    const handleReturnStatusUpdate = async (id: string, status: string) => {
        setProcessingId(id);
        try {
            const response = await updateReturnStatus(id, { status });
            if (response.success) {
                showToast(`Return request ${status.toLowerCase()} successfully`, 'success');
                fetchData();
                if (selectedReturn?.id === id) setSelectedReturn(null);
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to update return', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleTicketUpdate = async (id: string, status: string) => {
        setProcessingId(id);
        try {
            const response = await updateComplaintStatus(id, { 
                status, 
                response: replyText 
            });
            if (response.success) {
                showToast(`Ticket updated successfully`, 'success');
                setReplyText('');
                fetchData();
                if (selectedTicket?._id === id) setSelectedTicket(null);
            }
        } catch (error: any) {
            showToast(error.message || 'Failed to update ticket', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': 
            case 'Open': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Approved': 
            case 'Resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Rejected': 
            case 'Closed': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header section */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-neutral-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-neutral-900 uppercase tracking-tight">Customer Issues</h1>
                        <p className="text-neutral-500 font-medium mt-1">Manage return requests and support tickets.</p>
                    </div>
                    
                    <div className="flex gap-2 bg-neutral-50 p-1.5 rounded-2xl border border-neutral-200 overflow-x-auto no-scrollbar">
                        {['All Status', 'Pending', 'Approved', 'Open', 'Resolved'].filter(s => {
                            if (activeTab === 'Returns') return ['All Status', 'Pending', 'Approved', 'Rejected'].includes(s);
                            return ['All Status', 'Open', 'In Progress', 'Resolved', 'Closed'].includes(s);
                        }).map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    filter === s 
                                    ? 'bg-neutral-900 text-white shadow-lg shadow-black/10' 
                                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-white'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-neutral-100">
                    <button 
                        onClick={() => { setActiveTab('Returns'); setFilter('All Status'); }}
                        className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${
                            activeTab === 'Returns' ? 'text-teal-600' : 'text-neutral-400 hover:text-neutral-600'
                        }`}
                    >
                        Return Requests
                        {activeTab === 'Returns' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
                    </button>
                    <button 
                        onClick={() => { setActiveTab('Tickets'); setFilter('All Status'); }}
                        className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${
                            activeTab === 'Tickets' ? 'text-teal-600' : 'text-neutral-400 hover:text-neutral-600'
                        }`}
                    >
                        Support Tickets
                        {activeTab === 'Tickets' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-64 rounded-[2.5rem] animate-pulse border border-neutral-100"></div>
                    ))}
                </div>
            ) : (activeTab === 'Returns' ? returns : tickets).length === 0 ? (
                <div className="bg-white py-24 flex flex-col items-center justify-center text-center space-y-6 rounded-[3rem] shadow-sm border border-neutral-100">
                    <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-xl shadow-teal-500/10">
                        🎉
                    </div>
                    <div className="space-y-2 max-w-sm px-6">
                        <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">All Clear!</h2>
                        <p className="text-neutral-500 font-medium italic">
                            Excellent! There are no {activeTab === 'Returns' ? 'return requests' : 'tickets'} matching this filter.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'Returns' ? (
                        returns.map((ret) => (
                            <motion.div 
                                layoutId={ret.id}
                                key={ret.id}
                                className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group overflow-hidden"
                            >
                                <div className="p-6 text-left">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${getStatusColor(ret.status)}`}>
                                            {ret.status}
                                        </span>
                                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none">
                                            {new Date(ret.date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-16 h-16 bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-100 flex-shrink-0">
                                            {ret.image ? (
                                                <img src={ret.image} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-neutral-900 text-sm truncate uppercase tracking-tight leading-tight">{ret.productName}</h3>
                                            <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">{ret.customerName}</p>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 mb-6">
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 leading-none">Return Reason</p>
                                        <p className="text-xs text-neutral-700 font-medium italic truncate">
                                            "{ret.returnReason}"
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedReturn(ret)}
                                            className="flex-1 px-4 py-3 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-neutral-800 transition-all active:scale-95"
                                        >
                                            View Details
                                        </button>
                                        {ret.status === 'Pending' && (
                                            <>
                                                <button 
                                                    disabled={processingId === ret.id}
                                                    onClick={() => handleReturnStatusUpdate(ret.id, 'Approved')}
                                                    className="px-4 py-3 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {processingId === ret.id ? '...' : 'Accept'}
                                                </button>
                                                <button 
                                                    disabled={processingId === ret.id}
                                                    onClick={() => handleReturnStatusUpdate(ret.id, 'Rejected')}
                                                    className="px-4 py-3 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        tickets.map((ticket) => (
                            <motion.div 
                                layoutId={ticket._id}
                                key={ticket._id}
                                className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group overflow-hidden"
                            >
                                <div className="p-6 text-left">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="mb-5">
                                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">{ticket.category}</p>
                                        <h3 className="font-black text-neutral-900 text-sm uppercase tracking-tight leading-tight line-clamp-1">{ticket.subject}</h3>
                                        <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">By: {ticket.customer.name}</p>
                                    </div>

                                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 mb-6">
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 leading-none">Issue Description</p>
                                        <p className="text-xs text-neutral-700 font-medium italic line-clamp-2">
                                            "{ticket.message}"
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="flex-1 px-4 py-3 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-neutral-800 transition-all active:scale-95"
                                        >
                                            Respond
                                        </button>
                                        {ticket.status === 'Open' && (
                                            <button 
                                                disabled={processingId === ticket._id}
                                                onClick={() => handleTicketUpdate(ticket._id, 'In Progress')}
                                                className="px-4 py-3 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                            >
                                                Start Working
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Return Modal */}
            <AnimatePresence>
                {selectedReturn && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReturn(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedReturn(null)} className="absolute right-6 top-6 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-all"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                            <div className="p-10 text-left">
                                <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tight mb-8">Return Request</h2>
                                <div className="space-y-6">
                                    <div className="flex gap-6 items-center">
                                        <div className="w-24 h-24 bg-neutral-100 rounded-[2.5rem] overflow-hidden border-2 border-neutral-50 shadow-inner">
                                            {selectedReturn.image ? <img src={selectedReturn.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Product</p>
                                            <h4 className="text-xl font-black text-neutral-900 uppercase tracking-tight">{selectedReturn.productName}</h4>
                                            <p className="text-sm font-bold text-teal-600">Order ID: {selectedReturn.orderId}</p>
                                        </div>
                                    </div>
                                    <div className="bg-rose-50/30 p-8 rounded-[2.5rem] border border-rose-100">
                                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Reason for return</p>
                                        <p className="text-lg text-neutral-800 italic font-medium">"{selectedReturn.returnReason}"</p>
                                    </div>
                                </div>
                                <div className="mt-10 flex gap-4">
                                    {selectedReturn.status === 'Pending' && (
                                        <>
                                            <button onClick={() => handleReturnStatusUpdate(selectedReturn.id, 'Approved')} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">Approve</button>
                                            <button onClick={() => handleReturnStatusUpdate(selectedReturn.id, 'Rejected')} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20">Reject</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {selectedTicket && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedTicket(null)} className="absolute right-6 top-6 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-all"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                            <div className="p-10 text-left">
                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em]">{selectedTicket.category}</span>
                                <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tight mb-6">{selectedTicket.subject}</h2>
                                
                                <div className="space-y-6">
                                    <div className="bg-neutral-50 p-6 rounded-[2rem] border border-neutral-100">
                                        <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-3 whitespace-pre-wrap leading-relaxed">Ticket ID: {selectedTicket._id}</p>
                                        <p className="text-sm font-medium text-neutral-700 leading-relaxed italic">"{selectedTicket.message}"</p>
                                    </div>

                                    {selectedTicket.order && (
                                        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 flex justify-between items-center">
                                            <p className="text-xs font-bold text-teal-700 uppercase tracking-widest">Order: {selectedTicket.order.orderNumber}</p>
                                            <p className="text-xs font-black text-neutral-900 tracking-widest uppercase">₹{selectedTicket.order.totalPrice}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">Official Response</label>
                                        <textarea 
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Write your resolution or update here..."
                                            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-sm focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all resize-none min-h-[120px]"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-4">
                                    <button 
                                        disabled={processingId === selectedTicket._id || !replyText.trim()}
                                        onClick={() => handleTicketUpdate(selectedTicket._id, 'Resolved')}
                                        className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-500/20"
                                    >
                                        Resolve Ticket
                                    </button>
                                    <button 
                                        disabled={processingId === selectedTicket._id || !replyText.trim()}
                                        onClick={() => handleTicketUpdate(selectedTicket._id, 'In Progress')}
                                        className="flex-1 py-4 bg-neutral-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-all disabled:opacity-50"
                                    >
                                        Save Draft
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
