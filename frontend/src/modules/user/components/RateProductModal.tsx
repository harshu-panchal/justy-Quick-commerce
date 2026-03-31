import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/button';
import { addReview } from '../../../services/api/customerReviewService';
import { useToast } from '../../../context/ToastContext';

interface RateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    productImage?: string;
    orderId?: string;
    onSuccess?: () => void;
}

export default function RateProductModal({
    isOpen,
    onClose,
    productId,
    productName,
    productImage,
    orderId = "",
    onSuccess
}: RateProductModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [title, setTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            showToast('Please select a rating', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const response = await addReview({
                productId,
                orderId: orderId || undefined,
                rating,
                comment,
                title,
            });

            if (response.success) {
                showToast('Review submitted successfully! It will be visible after moderation.', 'success');
                onSuccess?.();
                onClose();
            } else {
                showToast(response.message || 'Failed to submit review', 'error');
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Something went wrong', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-neutral-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-teal-600 to-emerald-800 p-5 text-white text-center relative">
                        <button 
                            onClick={onClose}
                            className="absolute right-4 top-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h2 className="text-lg font-black uppercase tracking-tight">Rate & Review</h2>
                        <p className="text-teal-100/70 text-[10px] font-bold uppercase tracking-widest mt-1">Tell us about your experience</p>
                    </div>

                    <div className="p-5">
                        {/* Product Info */}
                        <div className="flex items-center gap-3 mb-5 p-2 bg-neutral-50/50 rounded-2xl border border-neutral-100">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0 border border-neutral-100">
                                {productImage ? (
                                    <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-neutral-800 truncate text-sm uppercase">{productName}</p>
                                {orderId && (
                                    <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-black mt-0.5">Order #{orderId.slice(-8)}</p>
                                )}
                            </div>
                        </div>

                        {/* Star Rating Section */}
                        <div className="text-center mb-6">
                            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-2">Tap to Rate</p>
                            <div className="flex justify-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="transition-transform active:scale-90"
                                    >
                                        <svg 
                                            width="32" 
                                            height="32" 
                                            viewBox="0 0 24 24" 
                                            fill={(hoverRating || rating) >= star ? '#FBBF24' : 'none'} 
                                            stroke={(hoverRating || rating) >= star ? '#FBBF24' : '#E5E5E5'} 
                                            strokeWidth="2"
                                            className="transition-all duration-200"
                                        >
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] font-black text-teal-600 mt-2 h-4 uppercase tracking-widest">
                                {rating > 0 ? (
                                    rating === 1 ? 'Poor' :
                                    rating === 2 ? 'Fair' :
                                    rating === 3 ? 'Good' :
                                    rating === 4 ? 'Very Good' : 'Excellent!'
                                ) : ''}
                            </p>
                        </div>

                        {/* Review Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Title (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Summarize your experience..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium text-sm"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Review</label>
                                <textarea
                                    rows={3}
                                    placeholder="What did you like or dislike?"
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-100 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all resize-none font-medium text-sm"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Total Buttons */}
                        <div className="mt-6 flex gap-3">
                            <button
                                className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 transition-all active:scale-95"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Not Now
                            </button>
                            <button
                                className="flex-[2] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-neutral-900 text-white shadow-lg shadow-black/10 hover:bg-teal-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                onClick={handleSubmit}
                                disabled={submitting || rating === 0}
                            >
                                {submitting ? (
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Submit Review
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
