import React, { useEffect, useState } from 'react';
import { getSellerReviews, updateReviewStatus, replyToReview } from '../../../services/api/seller/reviewService';
import PageLoader from '../../../components/PageLoader';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Review {
    _id: string;
    product: {
        _id: string;
        productName: string;
        mainImage: string;
    };
    customer: {
        _id: string;
        name: string;
        profileImage?: string;
    };
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
    status: 'Pending' | 'Approved' | 'Rejected';
    sellerReply?: string;
    sellerRepliedAt?: string;
    createdAt: string;
}

interface Stats {
    totalReviews: number;
    averageRating: number;
    distribution: {
        [key: number]: number;
    };
}

export default function SellerRatings() {
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [replyingTo, setReplyingTo] = useState<Review | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await getSellerReviews();
            if (response.success) {
                setReviews(response.data);
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (reviewId: string, newStatus: 'Approved' | 'Rejected') => {
        try {
            const response = await updateReviewStatus(reviewId, newStatus);
            if (response.success) {
                toast.success(`Review ${newStatus.toLowerCase()}!`);
                setReviews(prev => prev.map(rev => rev._id === reviewId ? { ...rev, status: newStatus } : rev));
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleReplySubmit = async () => {
        if (!replyingTo || !replyContent.trim()) return;

        setReplySubmitting(true);
        try {
            const response = await replyToReview(replyingTo._id, replyContent);
            if (response.success) {
                toast.success('Reply posted successfully!');
                setReviews(prev => prev.map(rev => 
                    rev._id === replyingTo._id 
                    ? { ...rev, sellerReply: replyContent, sellerRepliedAt: new Date().toISOString() } 
                    : rev
                ));
                setReplyingTo(null);
                setReplyContent('');
            }
        } catch (error) {
            toast.error('Failed to post reply');
        } finally {
            setReplySubmitting(false);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8 animate-fadeIn pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-neutral-900 rounded-3xl p-8 lg:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-teal-500/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                    <div className="space-y-4">
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            CUSTOMER <span className="text-teal-400">FEEDBACKHUB</span>
                        </h1>
                        <p className="text-neutral-400 font-medium text-lg max-w-xl">
                            Unlock potential through patient observation. Every review helps you perfect your craft and build lasting trust.
                        </p>
                    </div>

                    <div className="flex items-center gap-8 bg-neutral-800/50 backdrop-blur-xl p-8 rounded-2xl border border-neutral-700/50 shadow-inner">
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">OVERALL STANDING</p>
                            <div className="flex flex-col items-center">
                                <span className="text-6xl font-black tracking-tighter text-white">
                                    {stats?.averageRating || 0}
                                </span>
                                <div className="flex items-center gap-1 mt-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <svg key={s} className={`w-4 h-4 ${s <= Math.round(stats?.averageRating || 0) ? 'text-yellow-400' : 'text-neutral-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-neutral-500 mt-2">{stats?.totalReviews || 0} TOTAL REVIEWS</p>
                            </div>
                        </div>
                        
                        <div className="w-px h-24 bg-neutral-700 mx-2 hidden sm:block" />
                        
                        <div className="flex-1 min-w-[180px] space-y-3">
                            {[5, 4, 3, 2, 1].map((s) => {
                                const count = stats?.distribution[s] || 0;
                                const percentage = stats?.totalReviews ? (count / stats.totalReviews) * 100 : 0;
                                return (
                                    <div key={s} className="flex items-center gap-4">
                                        <span className="text-xs font-black text-neutral-400 w-6">{s}★</span>
                                        <div className="flex-1 h-2 bg-neutral-700/50 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.5)]" 
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-neutral-500 w-6 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-neutral-300 shadow-sm">
                    <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-neutral-800 uppercase tracking-tight">No reviews yet</h2>
                    <p className="text-neutral-500 font-medium mt-2">When customers rate your products, they will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                        {reviews.map((review, index) => (
                            <motion.div 
                                key={review._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                layout
                                className="group relative bg-white rounded-3xl border border-neutral-200 p-8 hover:border-teal-500 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden"
                            >
                                {/* Reviewer Info & Badge */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            {review.customer.profileImage ? (
                                                <img src={review.customer.profileImage} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" />
                                            ) : (
                                                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg">
                                                    {review.customer.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center">
                                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight leading-none mb-1">
                                                {review.customer.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border ${
                                                    review.status === 'Approved' ? 'bg-teal-50 text-teal-600 border-teal-100' : 
                                                    review.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {review.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20">
                                        <span className="text-yellow-600 font-black text-base">{review.rating}</span>
                                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Product Context */}
                                <div className="mb-6 flex items-center gap-3 bg-neutral-50/80 rounded-2xl p-3 border border-neutral-100 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 overflow-hidden flex-shrink-0">
                                        <img src={review.product.mainImage} alt={review.product.productName} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">REVIEWED PRODUCT</p>
                                        <h4 className="text-sm font-black text-neutral-800 uppercase truncate">{review.product.productName}</h4>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <div className="space-y-4 mb-8">
                                    {review.title && <h5 className="font-black text-neutral-900 uppercase text-sm">{review.title}</h5>}
                                    <p className="text-neutral-600 font-medium text-base leading-relaxed italic border-l-4 border-teal-500/30 pl-4 py-1">
                                        "{review.comment}"
                                    </p>
                                    
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex gap-2 pt-2">
                                            {review.images.map((img, i) => (
                                                <img 
                                                    key={i} 
                                                    src={img} 
                                                    alt="" 
                                                    className="w-16 h-16 rounded-xl object-cover border border-neutral-200 hover:scale-105 transition-transform cursor-pointer" 
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {review.sellerReply && (
                                        <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-100 mt-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-5 h-5 bg-teal-500 rounded flex items-center justify-center text-[10px] text-white">S</div>
                                                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Your Response</span>
                                                <span className="text-[8px] text-teal-400 font-bold ml-auto uppercase">{new Date(review.sellerRepliedAt!).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-medium text-teal-800 leading-relaxed italic pr-4">
                                                "{review.sellerReply}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between items-center pt-6 border-t border-neutral-100">
                                    <div className="flex gap-2">
                                        {review.status !== 'Approved' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(review._id, 'Approved')}
                                                className="px-4 py-2 bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-teal-600 transition-all shadow-md active:scale-95"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {review.status !== 'Rejected' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(review._id, 'Rejected')}
                                                className="px-4 py-2 bg-neutral-100 text-neutral-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                                            >
                                                Reject
                                            </button>
                                        )}
                                    </div>
                                    {!review.sellerReply && (
                                        <button 
                                            onClick={() => setReplyingTo(review)}
                                            className="flex items-center gap-2 text-[10px] font-black text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-widest group/btn"
                                        >
                                            Reply to Feedback
                                            <svg className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Reply Modal */}
            <AnimatePresence>
                {replyingTo && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-neutral-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-neutral-900 px-8 py-10 text-white relative">
                                <button 
                                    onClick={() => setReplyingTo(null)}
                                    className="absolute right-6 top-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 group"
                                >
                                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L12 12m0 0l6 6m-6-6l-6-6m6 6l6-6" />
                                    </svg>
                                </button>
                                <p className="text-teal-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">RESPONSE PORTAL</p>
                                <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-4">Reply to {replyingTo.customer.name}</h2>
                                <div className="bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700/30">
                                    <p className="text-neutral-400 text-sm italic italic_pl-4 border-l-2 border-teal-500/50 pl-3">
                                        "{replyingTo.comment}"
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">Your Professional Response</label>
                                        <textarea
                                            rows={6}
                                            placeholder="Acknowledge the feedback and share how you'll improve or thank them for the support..."
                                            className="w-full px-6 py-5 rounded-2xl border-2 border-neutral-100 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all resize-none font-medium text-neutral-700 bg-neutral-50/50 placeholder:text-neutral-300"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <button
                                            className="flex-1 py-4 rounded-2xl bg-neutral-100 text-neutral-600 font-black uppercase tracking-[0.1em] text-xs hover:bg-neutral-200 transition-all active:scale-95"
                                            onClick={() => setReplyingTo(null)}
                                        >
                                            Discard
                                        </button>
                                        <button
                                            className="flex-[2] py-4 rounded-2xl bg-teal-500 text-white font-black uppercase tracking-[0.15em] text-xs shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                            onClick={handleReplySubmit}
                                            disabled={replySubmitting || !replyContent.trim()}
                                        >
                                            {replySubmitting ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Transmit Response
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

