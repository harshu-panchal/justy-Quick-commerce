import api from '../config';

export interface EquipmentItem {
    _id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    imageUrl?: string;
    isActive: boolean;
    minQuantity: number;
    deliveryCharge: number;
    platformFee: number;
}

export interface EquipmentOrder {
    _id: string;
    orderNumber: string;
    items: any[];
    total: number;
    status: string;
    paymentStatus: string;
    deliveryBoy?: any;
    paymentMethod?: "Online" | "COD";
    rejectionReason?: string;
    cancellationReason?: string;
    refundStatus?: string;
    deliveryAddress?: {
        address: string;
        city: string;
        state?: string;
        pincode: string;
        landmark?: string;
        latitude?: number;
        longitude?: number;
    };
    createdAt: string;
}

export const getSellerEquipmentItems = async () => {
    const response = await api.get('/equipment/items');
    return response.data;
};

export const createEquipmentOrder = async (
    items: Array<{ equipmentItem: string; quantity: number }>,
    paymentMethod: "Online" | "COD" = "Online",
    deliveryAddress?: any
) => {
    const response = await api.post('/equipment/orders', { items, paymentMethod, deliveryAddress });
    return response.data;
};

export const createEquipmentRazorpayOrder = async (orderId: string) => {
    const response = await api.post(`/equipment/orders/${orderId}/create-payment`, {});
    return response.data;
};

export const captureEquipmentPayment = async (data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}) => {
    const { orderId, ...paymentData } = data;
    const response = await api.post(`/equipment/orders/${orderId}/verify-payment`, paymentData);
    return response.data;
};

export const getSellerEquipmentOrders = async () => {
    const response = await api.get('/equipment/orders/my');
    return response.data;
};

export const cancelEquipmentOrder = async (id: string, reason: string) => {
    const response = await api.post(`/equipment/orders/${id}/cancel`, { reason });
    return response.data;
};

export const requestEquipmentRefund = async (orderId: string, bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
}) => {
    const response = await api.post('/equipment/orders/request-refund', { orderId, bankDetails });
    return response.data;
};
