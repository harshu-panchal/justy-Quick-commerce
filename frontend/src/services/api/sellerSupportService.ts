import api from './config';

export interface SupportTicketData {
    category: string;
    subject: string;
    message: string;
    priority?: string;
    images?: string[];
}

export const raiseSupportTicket = async (data: SupportTicketData) => {
    try {
        const response = await api.post('/seller/complaints/raise', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const getMySupportTickets = async (status?: string) => {
    try {
        const url = status ? `/seller/complaints?status=${status}` : '/seller/complaints';
        const response = await api.get(url);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
