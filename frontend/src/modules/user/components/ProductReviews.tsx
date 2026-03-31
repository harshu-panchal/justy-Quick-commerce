import React, { useEffect, useState } from 'react';
import { getProductReviews, Review } from '../../../services/api/customerReviewService';
import StarRating from '../../../components/ui/StarRating';
import RateProductModal from './RateProductModal';
import { useAuth } from '../../../context/AuthContext';

interface ProductReviewsProps {
    productId: string;
    productName?: string;
    productImage?: string;
}

export default function ProductReviews({ productId, productName = "Product", productImage }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRateModal, setShowRateModal] = useState(false);
    const { user } = useAuth();

    const fetchReviews = async () => {
        try {
            const response = await getProductReviews(productId);
            if (response.success && response.data && Array.isArray(response.data.reviews)) {
                setReviews(response.data.reviews);
            } else if (response.success && Array.isArray(response.data)) {
                setReviews(response.data);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [productId]);

    if (loading) {
        return (
            <div className="py-8 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                    <div className="h-20 bg-neutral-100 rounded-xl"></div>
                    <div className="h-20 bg-neutral-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-8 space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight">
                    Customer Reviews ({reviews.length})
                </h3>
                
                {user && (
                    <button 
                        onClick={() => setShowRateModal(true)}
                        className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-teal-600 transition-all active:scale-95 shadow-lg shadow-black/10"
                    >
                        Write a Review
                    </button>
                )}
            </div>
            
            {(!Array.isArray(reviews) || reviews.length === 0) ? (
                <div className="py-12 text-center bg-neutral-50/50 rounded-[2rem] border-2 border-dashed border-neutral-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No reviews yet</p>
                    <p className="text-neutral-400 text-[10px] mt-1">Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {reviews.map((review) => (
                        <div key={review._id} className="group pb-8 border-b border-neutral-100 last:border-0">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-lg font-black text-neutral-400 border border-neutral-200">
                                        {review.customer?.name?.charAt(0) || "A"}
                                    </div>
                                    <div>
                                        <p className="font-black text-neutral-900 uppercase tracking-tight text-sm">
                                            {review.customer?.name || "Anonymous Customer"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <StarRating rating={review.rating} size="sm" showCount={false} />
                                            {(review as any).isVerifiedPurchase && (
                                                <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Verified Purchase
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex-shrink-0 ml-4">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            
                            <div className="pl-16">
                                {review.title && <h4 className="font-black text-sm text-neutral-800 mb-2 uppercase tracking-tight">{review.title}</h4>}
                                <p className="text-neutral-600 text-base leading-relaxed italic border-l-4 border-teal-500/20 pl-4 py-1">
                                    "{review.comment}"
                                </p>

                                {review.sellerReply && (
                                    <div className="mt-6 bg-teal-50/50 p-5 rounded-2xl border border-teal-100/50 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-5">
                                            <svg className="w-12 h-12 text-teal-900" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5 bg-teal-500 rounded-lg flex items-center justify-center text-[10px] text-white font-black">S</div>
                                            <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest leading-none">Official Response</span>
                                        </div>
                                        <p className="text-sm text-teal-800 italic font-medium leading-relaxed pr-8">
                                            "{review.sellerReply}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <RateProductModal 
                isOpen={showRateModal}
                onClose={() => setShowRateModal(false)}
                productId={productId}
                productName={productName}
                productImage={productImage}
                onSuccess={() => {
                    fetchReviews();
                }}
            />
        </div>
    );
}
