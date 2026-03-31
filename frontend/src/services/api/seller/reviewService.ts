import api from '../config';

export const getSellerReviews = async () => {
    const response = await api.get('/seller/reviews');
    return response.data;
};

export const updateReviewStatus = async (reviewId: string, status: 'Approved' | 'Rejected' | 'Pending') => {
    const response = await api.patch(`/seller/reviews/${reviewId}/status`, { status });
    return response.data;
};

export const replyToReview = async (reviewId: string, reply: string) => {
    const response = await api.post(`/seller/reviews/${reviewId}/reply`, { reply });
    return response.data;
};
