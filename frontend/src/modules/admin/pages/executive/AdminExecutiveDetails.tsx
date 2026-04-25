import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface AdminExecutiveDetailsProps {
    executive: any;
    onClose: () => void;
    onUpdate: (id: string, data: any) => Promise<void>;
}

export default function AdminExecutiveDetails({ executive, onClose, onUpdate }: AdminExecutiveDetailsProps) {
    const [rejectionMode, setRejectionMode] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this executive?')) return;
        setSubmitting(true);
        try {
            await onUpdate(executive._id, { kycStatus: 'Approved', status: 'Active' });
            toast.success('Executive KYC approved and account activated');
            onClose();
        } catch (error) {
            toast.error('Failed to approve KYC');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        setSubmitting(true);
        try {
            await onUpdate(executive._id, { 
                kycStatus: 'Rejected', 
                rejectionReason 
            });
            toast.success('Executive KYC rejected');
            onClose();
        } catch (error) {
            toast.error('Failed to reject KYC');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-4xl bg-neutral-50 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 bg-white border-b border-neutral-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Executive Details</h2>
                        <p className="text-neutral-400 font-bold text-sm">Review KYC documents and bank details</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-neutral-50 rounded-lg text-neutral-400 hover:text-neutral-900 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Basic Info */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InfoCard label="Full Name" value={executive.name} />
                        <InfoCard label="Mobile Number" value={executive.mobile} />
                        <InfoCard label="Email Address" value={executive.email || 'N/A'} />
                        <InfoCard label="Referral Code" value={executive.referralCode} />
                        <InfoCard label="Status" value={executive.status} statusColor={executive.status === 'Active' ? 'text-emerald-600' : 'text-red-600'} />
                        <InfoCard label="KYC Status" value={executive.kycStatus} statusColor={executive.kycStatus === 'Approved' ? 'text-emerald-600' : 'text-orange-600'} />
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* KYC Documents */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Identity Documents</h3>
                            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase">Aadhar Number</p>
                                        <p className="font-bold text-neutral-900">{executive.kycDetails?.aadharNumber || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase">PAN Number</p>
                                        <p className="font-bold text-neutral-900">{executive.kycDetails?.panNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <DocPreview label="Aadhar Front" url={executive.kycDetails?.aadharFront} />
                                    <DocPreview label="Aadhar Back" url={executive.kycDetails?.aadharBack} />
                                    <DocPreview label="PAN Card" url={executive.kycDetails?.panCard} />
                                    <DocPreview label="Resume" url={executive.kycDetails?.resume} />
                                    <DocPreview label="Bank Passbook" url={executive.kycDetails?.bankPassbook} className="col-span-2" />
                                </div>
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Bank Account Information</h3>
                            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    <InfoLine label="Account Holder" value={executive.bankDetails?.accountHolderName} />
                                    <InfoLine label="Bank Name" value={executive.bankDetails?.bankName} />
                                    <InfoLine label="Account Number" value={executive.bankDetails?.accountNumber} />
                                    <InfoLine label="IFSC Code" value={executive.bankDetails?.ifscCode} />
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Earnings Info</p>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-2xl font-black text-emerald-900">₹{executive.walletBalance}</p>
                                        <p className="text-[10px] font-bold text-emerald-600 italic">Total Wallet Balance</p>
                                    </div>
                                </div>
                            </div>

                            {executive.rejectionReason && (
                                <div className="p-4 bg-red-50 rounded-lg border border-red-100 space-y-1">
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Previous Rejection Reason</p>
                                    <p className="text-xs font-bold text-red-900 italic">"{executive.rejectionReason}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-white border-t border-neutral-100 shrink-0">
                    <AnimatePresence mode="wait">
                        {rejectionMode ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Reason for Rejection</label>
                                    <textarea 
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="e.g. Documents are blurry, IFSC code is incorrect..."
                                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 rounded-lg focus:border-red-500 focus:bg-white outline-none transition-all font-bold text-sm min-h-[100px]"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setRejectionMode(false)}
                                        className="flex-1 py-4 bg-neutral-100 text-neutral-600 rounded-lg font-black transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleReject}
                                        disabled={submitting}
                                        className="flex-[2] py-4 bg-red-600 text-white rounded-lg font-black transition-all active:scale-95 shadow-lg shadow-red-100 disabled:opacity-50"
                                    >
                                        {submitting ? 'Processing...' : 'Confirm Rejection'}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex gap-4"
                            >
                                {executive.kycStatus !== 'Approved' && (
                                    <>
                                        <button 
                                            onClick={() => setRejectionMode(true)}
                                            className="flex-1 py-4 border-2 border-red-100 text-red-600 rounded-lg font-black transition-all active:scale-95 hover:bg-red-50"
                                        >
                                            Reject KYC
                                        </button>
                                        <button 
                                            onClick={handleApprove}
                                            disabled={submitting}
                                            className="flex-[2] py-4 bg-emerald-600 text-white rounded-lg font-black transition-all active:scale-95 shadow-xl shadow-emerald-100 disabled:opacity-50"
                                        >
                                            {submitting ? 'Approving...' : 'Approve Executive'}
                                        </button>
                                    </>
                                )}
                                {executive.kycStatus === 'Approved' && (
                                    <button 
                                        disabled
                                        className="w-full py-4 bg-neutral-100 text-neutral-400 rounded-lg font-black cursor-not-allowed"
                                    >
                                        Already Verified
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

function InfoCard({ label, value, statusColor = 'text-neutral-900' }: any) {
    return (
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm space-y-1">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">{label}</p>
            <p className={`font-black ${statusColor}`}>{value || 'N/A'}</p>
        </div>
    );
}

function InfoLine({ label, value }: any) {
    return (
        <div className="flex justify-between items-center border-b border-neutral-50 pb-2 last:border-0 last:pb-0">
            <p className="text-[10px] font-black text-neutral-400 uppercase">{label}</p>
            <p className="font-bold text-neutral-900">{value || 'N/A'}</p>
        </div>
    );
}

function DocPreview({ label, url, className = '' }: any) {
    if (!url) return (
        <div className={`p-4 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-lg text-center ${className}`}>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[8px] font-bold text-neutral-300">NOT UPLOADED</p>
        </div>
    );

    const isPdf = url.toLowerCase().endsWith('.pdf');

    return (
        <div className={`space-y-1 ${className}`}>
            <p className="text-[10px] font-black text-neutral-400 uppercase ml-1">{label}</p>
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block relative group aspect-video bg-neutral-100 rounded-lg overflow-hidden border border-neutral-100"
            >
                {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="text-[10px] font-black mt-2">VIEW PDF</span>
                    </div>
                ) : (
                    <img src={url} className="w-full h-full object-cover" alt={label} />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white text-[10px] font-black uppercase tracking-widest">Open Full View</span>
                </div>
            </a>
        </div>
    );
}
