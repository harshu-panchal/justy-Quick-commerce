import api from "./config";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductVariation {
  _id?: string;
  name?: string; // Mapped from title if needed, or direct
  value?: string;
  title?: string; // Frontend uses title
  price: number;
  discPrice: number;
  stock: number;
  status: "Available" | "Sold out" | "In stock"; // Added In stock
  sku?: string;
}

export interface Product {
  _id: string;
  productName: string;
  seller: string | any; // Updated to allow populated object
  headerCategoryId?: string | any; // Updated to allow populated object
  category?: string | any; // Updated to allow populated object
  subcategory?: string | any;
  subSubCategory?: string | any; // Added subSubCategory
  brand?: string | any; // Updated
  publish: boolean;
  popular: boolean;
  dealOfDay: boolean;
  seoTitle?: string;
  seoKeywords?: string;
  seoImageAlt?: string;
  seoDescription?: string;
  smallDescription?: string;
  tags: string[];
  manufacturer?: string;
  madeIn?: string;
  tax?: string | any; // Updated
  isReturnable: boolean;
  maxReturnDays?: number;
  totalAllowedQuantity: number;
  fssaiLicNo?: string;
  mainImageUrl?: string;
  mainImage?: string; // Mapped directly from Product model
  galleryImageUrls: string[];
  variations: ProductVariation[];
  variationType?: string;
  createdAt?: string;
  updatedAt?: string;
  // Fallback for old fields if any legacy code uses them
  sellerId?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  status?: string;
  rejectionReason?: string;
  // Shop by Store fields
  isShopByStoreOnly?: boolean;
  shopId?: string | any;
}

export interface CreateProductData {
  productName: string;
  headerCategoryId?: string;
  categoryId?: string;
  subcategoryId?: string;
  subSubCategoryId?: string;
  brandId?: string;
  publish: boolean;
  popular: boolean;
  dealOfDay: boolean;
  seoTitle?: string;
  seoKeywords?: string;
  seoImageAlt?: string;
  seoDescription?: string;
  smallDescription?: string;
  tags?: string[];
  manufacturer?: string;
  madeIn?: string;
  taxId?: string;
  isReturnable: boolean;
  maxReturnDays?: number;
  totalAllowedQuantity: number;
  fssaiLicNo?: string;
  mainImageUrl?: string;
  galleryImageUrls?: string[];
  variations: ProductVariation[];
  variationType?: string;
  isShopByStoreOnly?: boolean;
  shopId?: string;
}

export interface Shop {
  _id: string;
  name: string;
  storeId: string;
  image?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> { }

export interface GetProductsParams {
  search?: string;
  category?: string;
  status?: "published" | "unpublished" | "popular" | "dealOfDay";
  stock?: "inStock" | "outOfStock";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Create a new product
 */
export const createProduct = async (
  data: CreateProductData
): Promise<ApiResponse<Product>> => {
  const response = await api.post<ApiResponse<Product>>("/products", data);
  return response.data;
};

/**
 * Get seller's products with filters
 */
export const getProducts = async (
  params?: GetProductsParams
): Promise<ApiResponse<Product[]>> => {
  const response = await api.get<ApiResponse<Product[]>>("/products", {
    params,
  });

  // Mock augmentation for development/testing
  const mockProducts = JSON.parse(localStorage.getItem("products") || "[]");
  if (mockProducts.length > 0 && response.data.success) {
    // Basic filtering to simulate API behavior if search or category is provided
    let filteredMock = [...mockProducts];
    if (params?.search) {
      const search = params.search.toLowerCase();
      filteredMock = filteredMock.filter(p =>
        p.productName.toLowerCase().includes(search) ||
        p.category?.name.toLowerCase().includes(search)
      );
    }
    if (params?.category) {
      filteredMock = filteredMock.filter(p => p.category?.name === params.category || p.category?.slug === params.category);
    }

    // Merge with API results
    response.data.data = [...response.data.data, ...filteredMock];
    if (response.data.pagination) {
      response.data.pagination.total += filteredMock.length;
    }
  }

  return response.data;
};

/**
 * Get product by ID
 */
export const getProductById = async (
  id: string
): Promise<ApiResponse<Product>> => {
  const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return response.data;
};

/**
 * Update product
 */
export const updateProduct = async (
  id: string,
  data: UpdateProductData
): Promise<ApiResponse<Product>> => {
  const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
  return response.data;
};

/**
 * Update stock for a product variation
 */
export const updateStock = async (
  productId: string,
  variationId: string,
  stock: number,
  status?: "Available" | "Sold out"
): Promise<ApiResponse<Product>> => {
  const response = await api.patch<ApiResponse<Product>>(
    `/products/${productId}/variations/${variationId}/stock`,
    { stock, status }
  );
  return response.data;
};

/**
 * Bulk update stock for multiple variations
 */
export const bulkUpdateStock = async (
  updates: { productId: string; variationId: string; stock: number }[]
): Promise<any> => {
  const response = await api.patch("/products/bulk-stock-update", { updates });
  return response.data;
};

/**
 * Delete product
 */
export const deleteProduct = async (id: string): Promise<ApiResponse<void>> => {
  // Check if it's a mock product in localStorage
  const mockProducts = JSON.parse(localStorage.getItem("products") || "[]");
  const mockIndex = mockProducts.findIndex((p: any) => (p._id || p.id) === id);

  if (mockIndex !== -1) {
    // Remove from localStorage
    mockProducts.splice(mockIndex, 1);
    localStorage.setItem("products", JSON.stringify(mockProducts));

    // Return mock success response
    return {
      success: true,
      message: "Product deleted successfully",
      data: undefined as any
    };
  }

  // Otherwise, call the backend API
  const response = await api.delete<ApiResponse<void>>(`/products/${id}`);
  return response.data;
};

/**
 * Update product status (publish, popular, dealOfDay)
 */
export const updateProductStatus = async (
  id: string,
  status: { publish?: boolean; popular?: boolean; dealOfDay?: boolean }
): Promise<ApiResponse<Product>> => {
  const response = await api.patch<ApiResponse<Product>>(
    `/products/${id}/status`,
    status
  );
  return response.data;
};

/**
 * Get all active shops (for seller to select when creating shop-by-store-only products)
 */
export const getShops = async (): Promise<ApiResponse<Shop[]>> => {
  const response = await api.get<ApiResponse<Shop[]>>("/products/shops");
  return response.data;
};
