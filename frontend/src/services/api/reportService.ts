import api from './config';

export interface SalesReportParams {
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface SalesReport {
    orderId: string;
    orderItemId: string;
    product: string;
    variant: string;
    total: number;
    date: string;
}

export interface SalesReportResponse {
    success: boolean;
    message: string;
    data: SalesReport[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface GeneralAnalyticsResponse {
    success: boolean;
    data: {
        metrics: Array<{ label: string; value: string; desc: string; icon: string }>;
        salesTrends: number[];
        weekTotal: number;
        peakHour: string;
        growth: string;
        topRevenueItem: string;
    };
}

export interface GrowthInsightsResponse {
    success: boolean;
    data: {
        promoRevenue: number;
        promoOrders: number;
        visibilityScore: string;
        activeCampaigns: number;
        recommendations: Array<{ title: string; impact: string; action: string }>;
    };
}

export const getSalesReport = async (params: SalesReportParams): Promise<SalesReportResponse> => {
    const response = await api.get<SalesReportResponse>('/seller/reports/sales', { params });
    return response.data;
};

export const getGeneralAnalytics = async (): Promise<GeneralAnalyticsResponse> => {
    const response = await api.get<GeneralAnalyticsResponse>('/seller/reports/analytics');
    return response.data;
};

export const getGrowthInsights = async (): Promise<GrowthInsightsResponse> => {
    const response = await api.get<GrowthInsightsResponse>('/seller/reports/growth');
    return response.data;
};
