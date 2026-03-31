import api from './config';

export interface ComplaintData {
    category: string;
    subject: string;
    message: string;
    orderId?: string;
    images?: string[];
}

export const submitComplaint = async (data: ComplaintData) => {
    try {
        const response = await api.post('/customer/complaints', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const getMyComplaints = async () => {
    try {
        const response = await api.get('/customer/complaints');
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
