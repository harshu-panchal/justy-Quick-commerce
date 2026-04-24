import api from '../../../services/api/config';


const API_URL = '/admin/executives';

export const getExecutives = async (params?: any) => {
    const response = await api.get(API_URL, { params });
    return response.data;
};

export const updateExecutive = async (id: string, data: any) => {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const getCategoryCommissions = async () => {
    const response = await api.get(`${API_URL}/commissions/categories`);
    return response.data;
};

export const updateCategoryCommission = async (data: { categoryName: string, amount: number }) => {
    const response = await api.put(`${API_URL}/commissions/categories`, data);
    return response.data;
};

export const getWithdrawalRequests = async (params?: any) => {
    const response = await api.get(`${API_URL}/withdrawals`, { params });
    return response.data;
};

export const processWithdrawal = async (id: string, data: { status: string, adminNote?: string, transactionId?: string }) => {
    const response = await api.put(`${API_URL}/withdrawals/${id}/process`, data);
    return response.data;
};
