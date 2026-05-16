import api from './config';

export interface HeaderCategory {
    _id: string; // MongoDB ID
    id?: string; // For backward compatibility if needed
    name: string;
    iconLibrary: string; // 'IonIcons' | 'MaterialIcons' | 'FontAwesome' | 'Feather'
    iconName: string;
    slug: string; // Maps to theme key
    relatedCategory?: string;
    deliveryType: 'quick' | 'scheduled';
    status: 'Published' | 'Unpublished';
    order?: number;
    scheduledTime?: string;
    assignedDeliveryBoy?: string;
    securityDeposit: number;
}

export const getHeaderCategoriesPublic = async (includeAll = false): Promise<HeaderCategory[]> => {
    try {
        const response = await api.get<any>('/header-categories', {
            params: { all: includeAll }
        });
        
        // Handle both formats: direct array or wrapped { success, data: [...] }
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        
        return [];
    } catch (error) {
        console.error('Failed to fetch public header categories', error);
        return []; // Fallback to empty instead of crashing
    }
};

export const getHeaderCategoriesAdmin = async (): Promise<HeaderCategory[]> => {
    try {
        const response = await api.get<any>('/header-categories/admin');
        
        // Handle both formats: direct array or wrapped { success, data: [...] }
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        
        return [];
    } catch (error) {
        console.error('Failed to fetch admin header categories', error);
        return [];
    }
};

export const createHeaderCategory = async (data: Partial<HeaderCategory>): Promise<HeaderCategory> => {
    const response = await api.post<HeaderCategory>('/header-categories', data);
    return response.data;
};

export const updateHeaderCategory = async (id: string, data: Partial<HeaderCategory>): Promise<HeaderCategory> => {
    const response = await api.put<HeaderCategory>(`/header-categories/${id}`, data);
    return response.data;
};

export const deleteHeaderCategory = async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/header-categories/${id}`);
    return response.data;
};
