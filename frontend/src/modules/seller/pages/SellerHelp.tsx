import React, { useState, useEffect } from 'react';
import { raiseSupportTicket, getMySupportTickets } from '../../../services/api/sellerSupportService';
import { updateComplaintStatus, ComplaintEntry } from '../../../services/api/seller/complaintService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SellerHelp() {
    const [tickets, setTickets] = useState<ComplaintEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData, setTicketData] = useState({
        category: 'Other',
        subject: '',
        message: '',
        priority: 'Medium'
    });
    const [submitting, setSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchMyTickets();
    }, []);

    const fetchMyTickets = async () => {
        setLoading(true);
        try {
            const res = await getMySupportTickets();
            if (res.success) {
                const myTickets = res.data.complaints.filter((c: any) => c.raisedByType === 'Seller');
                setTickets(myTickets);
            }
        } catch (error) {
            console.error("Fetch Tickets Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRaiseTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await raiseSupportTicket(ticketData);
            if (res.success) {
                toast.success('Support ticket raised successfully.');
                setShowTicketModal(false);
                setTicketData({ category: 'Other', subject: '', message: '', priority: 'Medium' });
                fetchMyTickets();
            }
        } catch (error) {
            toast.error('Failed to submit ticket.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseTicket = async (id: string) => {
        if (!window.confirm('Are you sure you want to close this ticket?')) return;
        
        setProcessingId(id);
        try {
            const res = await updateComplaintStatus(id, { status: 'Closed' });
            if (res.success) {
                toast.success('Ticket closed successfully.');
                fetchMyTickets();
            }
        } catch (error) {
            toast.error('Failed to close ticket.');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'In Progress': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Closed': return 'bg-neutral-100 text-neutral-500 border-neutral-200';
            default: return 'bg-neutral-50 text-neutral-400 border-neutral-100';
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/10 blur-[130px] -mr-[200px] -mt-[200px]" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-teal-400">Merchant Support Excellence</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight leading-none">Need Assistance? <br/><span className="text-teal-400">We are here to help.</span></h1>
                        <p className="text-slate-400 text-sm font-medium max-w-sm">Raise a high-priority support ticket and our team will resolve it within 24 hours.</p>
                    </div>

                    <button 
                        onClick={() => setShowTicketModal(true)}
                        className="px-10 py-5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-2xl transition-all shadow-xl shadow-teal-500/20 active:scale-95 uppercase tracking-widest flex items-center gap-3 group"
                    >
                        <span>NEW SUPPORT TICKET</span>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>
            </div>

            {/* Ticket List Section */}
            <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-neutral-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-neutral-900 uppercase tracking-tight">Recent Support Tickets</h2>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Lifecycle Tracking & Resolution History</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Total Tickets: {tickets.length}</span>
                    </div>
                </div>

                <div className="divide-y divide-neutral-50">
                    {loading ? (
                        <div className="py-20 text-center opacity-30 animate-pulse">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Records...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center opacity-30 select-none grayscale">
                            <span className="text-6xl mb-6">📂</span>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em]">No support activity found</p>
                            <p className="text-[10px] mt-2 italic font-medium">Your account standing is healthy.</p>
                        </div>
                    ) : (
                        tickets.map((ticket, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={ticket._id} 
                                className="p-8 hover:bg-neutral-50/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex gap-6 items-start flex-1">
                                    <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                                        {ticket.category === 'Payment/Payout' ? '💰' : '⚙️'}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{ticket.category}</span>
                                            <span className="text-[9px] font-bold text-neutral-300 uppercase tabular-nums tracking-widest">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-neutral-900 uppercase tracking-tight truncate">{ticket.subject}</h4>
                                        <p className="text-[11px] text-neutral-500 font-medium line-clamp-1 max-w-xl">"{ticket.message}"</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(ticket.status)}`}>
                                        {ticket.status}
                                    </div>
                                    
                                    {(ticket.status === 'Open' || ticket.status === 'In Progress' || ticket.status === 'Resolved') && (
                                        <button 
                                            disabled={processingId === ticket._id}
                                            onClick={() => handleCloseTicket(ticket._id)}
                                            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 border border-rose-100"
                                        >
                                            {processingId === ticket._id ? 'Closing...' : 'Close Ticket'}
                                        </button>
                                    )}

                                    <div className="text-right hidden md:block w-32 border-l border-neutral-100 pl-6">
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">ID Ref</p>
                                        <p className="font-mono text-[10px] font-bold text-neutral-300">{(ticket._id).slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Raise Ticket Modal */}
            <AnimatePresence>
                {showTicketModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTicketModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="bg-slate-900 p-8 text-white relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl -mr-16 -mt-16" />
                                <h3 className="text-xl font-black tracking-tight uppercase leading-none">Raise Support Ticket</h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">RAISING SYSTEM TICKET • ENCRYPTED CHANNEL</p>
                            </div>

                            <form onSubmit={handleRaiseTicket} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Category</label>
                                        <select 
                                            value={ticketData.category}
                                            onChange={(e) => setTicketData({...ticketData, category: e.target.value})}
                                            className="w-full h-12 bg-neutral-50 border border-neutral-100 rounded-xl px-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-teal-500/20"
                                        >
                                            <option>Other</option>
                                            <option>Order Issue</option>
                                            <option>Payment/Payout</option>
                                            <option>Technical Error</option>
                                            <option>Product Approval</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Priority</label>
                                        <select 
                                            value={ticketData.priority}
                                            onChange={(e) => setTicketData({...ticketData, priority: e.target.value})}
                                            className="w-full h-12 bg-neutral-50 border border-neutral-100 rounded-xl px-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-teal-500/20"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Subject</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Brief summary of your issue"
                                        value={ticketData.subject}
                                        onChange={(e) => setTicketData({...ticketData, subject: e.target.value})}
                                        className="w-full h-12 bg-neutral-50 border border-neutral-100 rounded-xl px-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Detailed Description</label>
                                    <textarea 
                                        rows={4}
                                        required
                                        placeholder="Please provide as much detail as possible..."
                                        value={ticketData.message}
                                        onChange={(e) => setTicketData({...ticketData, message: e.target.value})}
                                        className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowTicketModal(false)}
                                        className="flex-1 h-12 bg-neutral-100 text-neutral-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 h-12 bg-teal-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-teal-500 transition-all shadow-lg shadow-teal-600/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {submitting ? 'Transmitting...' : 'Dispatch Ticket'}
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

