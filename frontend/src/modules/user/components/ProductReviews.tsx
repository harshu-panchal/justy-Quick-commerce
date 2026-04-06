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
        <div className="py-6 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <h3 className="text-lg font-bold text-neutral-800">
                    Customer Reviews ({reviews.length})
                </h3>
                
                {user && (
                    <button 
                        onClick={() => setShowRateModal(true)}
                        className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all active:scale-95 shadow-sm"
                    >
                        Write a Review
                    </button>
                )}
            </div>
            
            {(!Array.isArray(reviews) || reviews.length === 0) ? (
                <div className="py-10 text-center bg-neutral-50/30 rounded-2xl border border-dashed border-neutral-200">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <p className="text-neutral-600 font-semibold text-sm">No reviews yet</p>
                    <p className="text-neutral-400 text-xs mt-1">Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {reviews.map((review) => (
                        <div key={review._id} className="group pb-6 border-b border-neutral-100 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-base font-bold text-neutral-500 border border-neutral-200">
                                        {review.customer?.name?.charAt(0) || "A"}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-neutral-800 text-sm">
                                            {review.customer?.name || "Anonymous Customer"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <StarRating rating={review.rating} size="sm" showCount={false} />
                                            {(review as any).isVerifiedPurchase && (
                                                <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    Verified Purchase
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            
                            <div className="pl-13">
                                {review.title && <h4 className="font-bold text-sm text-neutral-800 mb-1">{review.title}</h4>}
                                <p className="text-neutral-600 text-sm leading-relaxed">
                                    {review.comment}
                                </p>

                                {review.sellerReply && (
                                    <div className="mt-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5 bg-neutral-200 rounded-md flex items-center justify-center text-[10px] text-neutral-600 font-bold">S</div>
                                            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Official Response</span>
                                        </div>
                                        <p className="text-xs text-neutral-700 leading-relaxed italic">
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
