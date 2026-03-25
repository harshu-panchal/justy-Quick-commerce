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
    createdAt: string;
    updatedAt: string;
}

export interface EquipmentOrder {
    _id: string;
    orderNumber: string;
    seller: {
        _id: string;
        sellerName: string;
        email: string;
        mobile: string;
    };
    sellerName: string;
    sellerPhone: string;
    sellerAddress: string;
    items: Array<{
        equipmentItem: string;
        name: string;
        price: number;
        quantity: number;
        subtotal: number;
    }>;
    total: number;
    paymentStatus: string;
    status: string;
    deliveryBoy?: {
        _id: string;
        name: string;
        mobile: string;
    };
    assignedAt?: string;
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

// Admin Equipment Item CRUD
export const getAdminEquipmentItems = async () => {
    const response = await api.get('/admin/equipment/items');
    return response.data;
};

export const createEquipmentItem = async (data: Partial<EquipmentItem>) => {
    const response = await api.post('/admin/equipment/items', data);
    return response.data;
};

export const updateEquipmentItem = async (id: string, data: Partial<EquipmentItem>) => {
    const response = await api.put(`/admin/equipment/items/${id}`, data);
    return response.data;
};

export const deleteEquipmentItem = async (id: string) => {
    const response = await api.delete(`/admin/equipment/items/${id}`);
    return response.data;
};

export const toggleEquipmentItemStatus = async (id: string) => {
    const response = await api.patch(`/admin/equipment/items/${id}/status`, {});
    return response.data;
};

// Admin Equipment Orders
export const getAdminEquipmentOrders = async () => {
    const response = await api.get('/admin/equipment/orders');
    return response.data;
};

export const assignDeliveryBoy = async (orderId: string, deliveryBoyId: string) => {
    const response = await api.patch('/admin/equipment/orders/assign-delivery', { orderId, deliveryBoyId });
    return response.data;
};

export const approveEquipmentOrder = async (id: string) => {
    const response = await api.patch(`/admin/equipment/orders/${id}/approve`);
    return response.data;
};

export const rejectEquipmentOrder = async (id: string, reason: string) => {
    const response = await api.patch(`/admin/equipment/orders/${id}/reject`, { reason });
    return response.data;
};

// Refund Request Management
export interface RefundRequest {
    _id: string;
    orderId: {
        _id: string;
        orderNumber: string;
        total: number;
        status: string;
        paymentStatus: string;
    };
    sellerId: {
        _id: string;
        sellerName: string;
        email: string;
        mobile: string;
    };
    amount: number;
    refundMethod: 'BANK';
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        upiId?: string;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    adminNote?: string;
    transactionRef?: string;
    refundDate?: string;
    createdAt: string;
}

export const getAdminRefundRequests = async () => {
    const response = await api.get('/admin/equipment/refunds');
    return response.data;
};

export const updateRefundRequestStatus = async (id: string, data: { status: string; adminNote?: string; transactionRef?: string }) => {
    const response = await api.put(`/admin/equipment/refunds/${id}`, data);
    return response.data;
};

export const processRazorpayRefund = async (id: string) => {
    const response = await api.post(`/admin/equipment/refunds/${id}/test-razorpay`);
    return response.data;
};

// Get delivery boys for assignment
export const getDeliveryBoys = async () => {
    const response = await api.get('/admin/delivery');
    return response.data;
};

// Image Upload
export const uploadEquipmentImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'dhakadsnazzy/equipment');

    const response = await api.post('/upload/image', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
