import api from '../config';

export interface ReturnRequest {
    id: string;
    productName: string;
    customerName: string;
    orderId: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Completed';
    date: string;
    returnReason: string;
    image?: string;
}

export const getReturnRequests = async (status?: string) => {
    const response = await api.get('/returns', { params: { status } });
    return response.data;
};

export const getReturnRequestById = async (id: string) => {
    const response = await api.get(`/returns/${id}`);
    return response.data;
};

export const updateReturnStatus = async (id: string, data: { status: string; rejectionReason?: string; pickupScheduled?: string }) => {
    const response = await api.patch(`/returns/${id}/status`, data);
    return response.data;
};
