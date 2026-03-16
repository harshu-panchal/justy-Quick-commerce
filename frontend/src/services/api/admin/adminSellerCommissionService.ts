import api from '../config';

export interface CategoryCommission {
    headerCategoryId: string;
    name: string;
    commissionRate: number | null;
}

/**
 * Get category commissions for a specific seller
 */
export const getSellerCategoryCommissions = async (sellerId: string) => {
    try {
        const response = await api.get(`/admin/sellers/${sellerId}/category-commissions`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

/**
 * Save category commissions for a specific seller
 */
export const saveSellerCategoryCommissions = async (
    sellerId: string, 
    commissions: { headerCategoryId: string; commissionRate: number }[]
) => {
    try {
        const response = await api.post(`/admin/sellers/${sellerId}/category-commissions`, {
            commissions
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};
