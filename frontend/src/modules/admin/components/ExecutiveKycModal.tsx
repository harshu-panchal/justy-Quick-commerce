import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateExecutive } from '../services/adminExecutiveService';
import { Executive } from '../../../services/api/admin/executiveService';
import toast from 'react-hot-toast';

interface ExecutiveKycModalProps {
    executive: Executive;
    onClose: () => void;
    onUpdate: () => void;
}

export default function ExecutiveKycModal({ executive, onClose, onUpdate }: ExecutiveKycModalProps) {
    const [loading, setLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const handleAction = async (status: 'Approved' | 'Rejected') => {
        if (status === 'Rejected' && !rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setLoading(true);
        try {
            const response = await updateExecutive(executive._id, {
                kycStatus: status,
                rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
                status: status === 'Approved' ? 'Active' : undefined
            });
            if (response.success) {
                toast.success(`Executive KYC ${status.toLowerCase()} successfully`);
                onUpdate();
                onClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="px-8 py-6 bg-neutral-900 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">KYC Documents Review</h2>
                        <p className="text-neutral-400 text-sm mt-1">{executive.name} • {executive.mobile}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-neutral-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Documents Grid */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Submitted Documents</h3>
                            
                            <div className="space-y-4">
                                {Object.entries(executive.kycDocuments || {}).map(([key, url]) => (
                                    <div key={key} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-[10px] font-bold hover:underline">View Full Image</a>
                                        </div>
                                        <div className="aspect-video bg-neutral-100 rounded-xl overflow-hidden border border-neutral-100">
                                            <img src={url as string} alt={key} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                ))}
                                {!executive.kycDocuments && (
                                    <div className="py-20 text-center bg-white rounded-2xl border border-neutral-200">
                                        <p className="text-neutral-400 font-medium">No documents uploaded yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions & Info */}
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-neutral-900">Current Status</h3>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        executive.kycStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                        executive.kycStatus === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                                        executive.kycStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-500'
                                    }`}>
                                        {executive.kycStatus}
                                    </span>
                                </div>
                                {executive.rejectionReason && (
                                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Previous Rejection Reason</p>
                                        <p className="text-sm text-red-700 font-medium">{executive.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {showRejectForm ? (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <label className="text-sm font-bold text-neutral-900">Reason for Rejection</label>
                                        <textarea 
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Specify why the documents were rejected..."
                                            className="w-full h-32 p-4 bg-white border border-neutral-200 rounded-2xl focus:border-red-500 outline-none transition-all text-sm font-medium"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleAction('Rejected')}
                                                disabled={loading}
                                                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                                            >
                                                Confirm Reject
                                            </button>
                                            <button 
                                                onClick={() => setShowRejectForm(false)}
                                                className="px-6 py-4 bg-neutral-200 text-neutral-700 rounded-2xl font-bold hover:bg-neutral-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => handleAction('Approved')}
                                            disabled={loading || executive.kycStatus === 'Approved'}
                                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 disabled:opacity-50"
                                        >
                                            Approve KYC & Activate Account
                                        </button>
                                        <button 
                                            onClick={() => setShowRejectForm(true)}
                                            disabled={loading || executive.kycStatus === 'Rejected'}
                                            className="w-full py-4 bg-white border border-neutral-200 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            Reject Application
                                        </button>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
