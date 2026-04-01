import api from './config';

export const getFAQs = async (category?: string) => {
    try {
        const url = category ? `/faqs?category=${category}` : '/faqs';
        const response = await api.get(url);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const getFAQById = async (id: string) => {
    try {
        const response = await api.get(`/faqs/${id}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
