import api from './config';

export interface HeaderCategory {
    _id: string; // MongoDB ID
    id?: string; // For backward compatibility if needed
    name: string;
    iconLibrary: string; // 'IonIcons' | 'MaterialIcons' | 'FontAwesome' | 'Feather'
    iconName: string;
    slug: string; // Maps to theme key
    relatedCategory?: string;
    status: 'Published' | 'Unpublished';
    order?: number;
}

const MOCK_CATEGORIES: HeaderCategory[] = [
    { _id: '2', name: 'Fashion', iconLibrary: 'Feather', iconName: 'shirt', slug: 'fashion', status: 'Published', order: 2 },
    { _id: '3', name: 'Grocery', iconLibrary: 'Feather', iconName: 'shopping-basket', slug: 'grocery', status: 'Published', order: 3 },
    { _id: '4', name: 'Beauty', iconLibrary: 'Feather', iconName: 'sparkles', slug: 'beauty', status: 'Published', order: 4 },
    { _id: '5', name: 'Electronics', iconLibrary: 'Feather', iconName: 'cpu', slug: 'electronics', status: 'Published', order: 5 },
    { _id: '6', name: 'Pan Corner', iconLibrary: 'Feather', iconName: 'store', slug: 'pan-corner', status: 'Published', order: 6 },
    { _id: '7', name: 'Bakery', iconLibrary: 'Feather', iconName: 'cake', slug: 'bakery', status: 'Published', order: 7 },
    { _id: '8', name: 'Vegetables', iconLibrary: 'Feather', iconName: 'carrot', slug: 'vegetables', status: 'Published', order: 8 },
];

export const getHeaderCategoriesPublic = async (skipLoader = false): Promise<HeaderCategory[]> => {
    // Return mock categories for frontend-only requirement
    return MOCK_CATEGORIES;
};

export const getHeaderCategoriesAdmin = async (): Promise<HeaderCategory[]> => {
    // Return same mock categories for consistency in frontend-only dev
    return MOCK_CATEGORIES;
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
