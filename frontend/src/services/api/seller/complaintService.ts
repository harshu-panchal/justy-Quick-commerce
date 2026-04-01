import api from '../config';

export interface ComplaintEntry {
    _id: string;
    customer?: {
        name: string;
        email: string;
        mobile: string;
    };
    seller?: {
        sellerName: string;
        storeName: string;
        mobile: string;
    };
    order?: {
        orderNumber: string;
        status: string;
        totalPrice: number;
    };
    raisedByType: 'Customer' | 'Seller';
    category: string;
    subject: string;
    message: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    priority: string;
    response?: string;
    createdAt: string;
}

export const getSellerComplaints = async (status?: string) => {
    const response = await api.get('/seller/complaints', { params: { status } });
    return response.data;
};

export const updateComplaintStatus = async (id: string, data: { status?: string; response?: string }) => {
    const response = await api.patch(`/seller/complaints/${id}/status`, data);
    return response.data;
};
