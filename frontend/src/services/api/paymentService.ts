import api from './config';

/**
 * Create Razorpay order for payment
 */
export const createRazorpayOrder = async (orderId: string) => {
    try {
        const response = await api.post('/payment/create-order', { orderId });
        return response.data;
    } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

/**
 * Verify payment after Razorpay checkout
 */
export const verifyPayment = async (paymentData: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}) => {
    try {
        const response = await api.post('/payment/verify', paymentData);
        return response.data;
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        throw error;
    }
};

/**
 * Get payment history (if needed)
 */
export const getPaymentHistory = async () => {
    try {
        const response = await api.get('/customer/payments');
        return response.data;
    } catch (error: any) {
        console.error('Error getting payment history:', error);
        throw error;
    }
};

/**
 * Create Razorpay order for seller security deposit
 */
export const createSellerDepositOrder = async () => {
    try {
        const response = await api.post('/payment/seller/deposit/create-order');
        return response.data;
    } catch (error: any) {
        console.error('Error creating seller deposit order:', error);
        throw error;
    }
};

/**
 * Verify seller security deposit payment
 */
export const verifySellerDepositPayment = async (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}) => {
    try {
        const response = await api.post('/payment/seller/deposit/verify', paymentData);
        return response.data;
    } catch (error: any) {
        console.error('Error verifying seller deposit payment:', error);
        throw error;
    }
};
