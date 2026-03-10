import api from './config';
import { Product } from './productService'; // Reuse generic product type if compatible or define new one
import { apiCache } from '../../utils/apiCache';

export interface Category {
    _id: string; // MongoDB ID
    id?: string; // Virtual ID
    name: string;
    parent?: string | null;
    image?: string;
    icon?: string;
    description?: string;
    isActive: boolean;
    children?: Category[];
    subcategories?: Category[];
    headerCategoryId?: string | { _id: string; name?: string };
    totalProducts?: number;
}

export interface GetProductsParams {
    search?: string;
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'price_asc' | 'price_desc' | 'popular' | 'discount';
    page?: number;
    limit?: number;
    latitude?: number; // User location latitude
    longitude?: number; // User location longitude
}

export interface ProductListResponse {
    success: boolean;
    data: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface ProductDetailResponse {
    success: boolean;
    message?: string;
    data: Product & { similarProducts?: Product[] };
}

export interface CategoryListResponse {
    success: boolean;
    data: Category[];
}

/**
 * Get products with filters (Public)
 * Location (latitude/longitude) is required to filter products by seller's service radius
 */
/**
 * Get products with filters (Public)
 * Location (latitude/longitude) is required to filter products by seller's service radius
 */
export const getProducts = async (params?: GetProductsParams): Promise<ProductListResponse> => {
    const response = await api.get<ProductListResponse>('/customer/products', { params });

    // Mock augmentation for development/testing
    const mockProducts = JSON.parse(localStorage.getItem("products") || "[]");
    if (mockProducts.length > 0 && response.data.success) {
        let filteredMock = [...mockProducts];

        // Filter by category
        if (params?.category) {
            filteredMock = filteredMock.filter(p =>
                (p.category?.slug === params.category || p.category?.name === params.category || p.category?._id === params.category) ||
                (p.categoryId === params.category)
            );
        }

        // Map mock products to Customer Product format if needed
        // The mock products already follow a similar structure
        const mappedMock = filteredMock.map(p => ({
            id: p._id,
            ...p,
            price: p.variations?.[0]?.price || 0,
            originalPrice: p.variations?.[0]?.discPrice || p.variations?.[0]?.price || 0,
            image: p.mainImageUrl || p.mainImage,
            name: p.productName
        })) as unknown as Product[]; // Force cast for mock

        response.data.data = [...response.data.data, ...mappedMock];
        if (response.data.pagination) {
            response.data.pagination.total += mappedMock.length;
        }
    }

    return response.data;
};

/**
 * Get product details by ID (Public)
 * Location (latitude/longitude) is required to verify product availability
 */
export const getProductById = async (id: string, latitude?: number, longitude?: number): Promise<ProductDetailResponse> => {
    const params: any = {};
    if (latitude !== undefined && longitude !== undefined) {
        params.latitude = latitude;
        params.longitude = longitude;
    }
    const response = await api.get<ProductDetailResponse>(`/customer/products/${id}`, { params });
    return response.data;
};

/**
 * Get category details by ID or slug (Public)
 */
export const getCategoryById = async (id: string): Promise<any> => {
    const response = await api.get<any>(`/customer/categories/${id}`);
    return response.data;
};

/**
 * Get all categories (Public)
 * Using /tree endpoint to get hierarchy if available, otherwise just /
 */
export const getCategories = async (tree: boolean = false): Promise<CategoryListResponse> => {
    const url = tree ? '/customer/categories/tree' : '/customer/categories';
    const response = await api.get<CategoryListResponse>(url);
    return response.data;
};
