import api from './config';

export interface DashboardStats {
    totalUser: number;
    totalCategory: number;
    totalSubcategory: number;
    totalProduct: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    soldOutProducts: number;
    lowStockProducts: number;
    yearlyOrderData: { date: string; value: number }[];
    dailyOrderData: { date: string; value: number }[];
}

export interface NewOrder {
    id: string;
    orderDate: string;
    status: string;
    amount: number;
}

export interface DashboardResponse {
    success: boolean;
    message: string;
    data: {
        stats: DashboardStats;
        newOrders: NewOrder[];
    };
}

/**
 * Get seller's dashboard statistics
 */
export const getSellerDashboardStats = async (): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>('/seller/dashboard/stats');

    // Mock augmentation for development/testing
    const mockProducts = JSON.parse(localStorage.getItem("products") || "[]");
    if (mockProducts.length > 0 && response.data.success) {
        // Only count products belonging to the current seller mock ID if needed, 
        // but for seeding demo we can just add them.
        response.data.data.stats.totalProduct += mockProducts.length;
    }

    return response.data;
};
