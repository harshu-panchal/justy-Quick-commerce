import api from '../config';
import { ApiResponse } from './types';

export interface ProductField {
    _id: string;
    headerCategory: string | { _id: string; name: string };
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'time' | 'checkbox' | 'multi-input' | 'file';
    options?: string[];
    section?: string;
    placeholder?: string;
    status: 'Active' | 'Inactive';
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductFieldData {
    headerCategory: string;
    label: string;
    type: string;
    options?: string[];
    section?: string;
    placeholder?: string;
    status?: string;
}

export const getProductFields = async (): Promise<ApiResponse<ProductField[]>> => {
    const response = await api.get<ApiResponse<ProductField[]>>('/admin/product-fields');
    return response.data;
};

export const createProductField = async (data: CreateProductFieldData): Promise<ApiResponse<ProductField>> => {
    const response = await api.post<ApiResponse<ProductField>>('/admin/product-fields', data);
    return response.data;
};

export const updateProductField = async (id: string, data: Partial<CreateProductFieldData>): Promise<ApiResponse<ProductField>> => {
    const response = await api.put<ApiResponse<ProductField>>(`/admin/product-fields/${id}`, data);
    return response.data;
};

export const deleteProductField = async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/product-fields/${id}`);
    return response.data;
};
