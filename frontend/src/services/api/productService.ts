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

export interface ProductAddon {
  _id?: string;
  name: string;
  price: number;
  inStock?: boolean;
}

export interface ProductVariation {
  _id?: string;
  name?: string;
  value?: string;
  title?: string;
  price: number;
  discPrice: number;
  stock: number;
  status: "Available" | "Sold out" | "In stock";
  sku?: string;
}

export interface Product {
  _id: string;
  productName: string;
  seller: string | any;
  headerCategoryId?: string | any;
  category?: string | any;
  subcategory?: string | any;
  subSubCategory?: string | any;
  brand?: string | any;
  brandName?: string;
  publish: boolean;
  popular: boolean;
  dealOfDay: boolean;
  isJain?: boolean;
  spicyLevel?: 'None' | 'Mild' | 'Medium' | 'Hot';
  seoTitle?: string;
  seoKeywords?: string;
  seoImageAlt?: string;
  seoDescription?: string;
  smallDescription?: string;
  tags: string[];
  manufacturer?: string;
  madeIn?: string;
  tax?: string | any;
  isReturnable: boolean;
  maxReturnDays?: number;
  totalAllowedQuantity: number;
  fssaiLicNo?: string;
  hsnCode?: string;
  weight?: string;
  color?: string;
  size?: string;
  sku?: string;
  mainImageUrl?: string;
  mainImage?: string;
  galleryImageUrls: string[];
  variations: ProductVariation[];
  variationType?: string;
  createdAt?: string;
  updatedAt?: string;
  sellerId?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  taxId?: string;
  status?: string;
  rejectionReason?: string;
  isShopByStoreOnly?: boolean;
  shopId?: string | any;
  foodType?: 'Veg' | 'Non-Veg' | 'Egg';
  preparationTime?: number;
  timing?: string[];
  addons?: ProductAddon[];
  availabilityStatus?: 'Available' | 'Sold out';
  packagingPrice?: number;
}

export interface CreateProductData {
  productName: string;
  headerCategoryId?: string;
  categoryId?: string;
  subcategoryId?: string;
  subSubCategoryId?: string;
  brandId?: string;
  brandName?: string;
  publish: boolean;
  popular: boolean;
  dealOfDay: boolean;
  isJain?: boolean;
  spicyLevel?: 'None' | 'Mild' | 'Medium' | 'Hot';
  seoTitle?: string;
  seoKeywords?: string;
  seoImageAlt?: string;
  seoImage?: string;
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
  hsnCode?: string;
  weight?: string;
  color?: string;
  size?: string;
  sku?: string;
  mainImageUrl?: string;
  galleryImageUrls?: string[];
  variations: ProductVariation[];
  variationType?: string;
  isShopByStoreOnly?: boolean;
  shopId?: string;
  foodType?: 'Veg' | 'Non-Veg' | 'Egg';
  preparationTime?: number;
  timing?: string[];
  addons?: ProductAddon[];
  availabilityStatus?: 'Available' | 'Sold out';
  packagingPrice?: number;
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
}

export const createProduct = async (data: CreateProductData): Promise<ApiResponse<Product>> => {
  const response = await api.post("/products", data);
  return response.data;
};

export const getProducts = async (params: GetProductsParams): Promise<ApiResponse<Product[]>> => {
  const response = await api.get("/products", { params });
  return response.data;
};

export const getProductById = async (id: string): Promise<ApiResponse<Product>> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const updateProduct = async (id: string, data: UpdateProductData): Promise<ApiResponse<Product>> => {
  const response = await api.patch(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const generateProductDescriptionAI = async (data: { name: string; category?: string }): Promise<ApiResponse<{ description: string }>> => {
  const response = await api.post("/products/generate-description", data);
  return response.data;
};

export const getShops = async (): Promise<ApiResponse<Shop[]>> => {
  const response = await api.get("/shops");
  return response.data;
};
