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

export interface PharmacyData {
  tablets?: string;
  quantity?: string;
  treatment?: string;
  form?: string;
  prescriptionRequired?: boolean;
  packOf?: string;
  variant?: string;
  dosage?: string;
  therapeuticClassification?: string;
  composition?: string;
  containerType?: string;
  salesPackage?: string;
  manufacturingDate?: string | Date;
  expiryDate?: string | Date;
  sideEffects?: string;
  manufacturerName?: string;
  howItWorks?: string;
  safetyAdvice?: string;
  interactions?: string;
  manufacturerLicenseNo?: string;
  storage?: string;
  contraindications?: string;
  schedule?: string;
  medicineType?: string;
  underDPCO?: boolean;
  manufacturingProcess?: string;
  manufacturerAddress?: string;
  usageDescription?: string;
}

export interface FreshProduceData {
  packOf?: string;
  brand?: string;
  type?: string;
  quantity?: string;
  shelfLife?: string;
  form?: string;
  isOrganic?: boolean;
  commonName?: string;
  isWhole?: boolean;
  origin?: string;
  packagingType?: string;
  netQuantity?: string;
  addedPreservatives?: string;
  secondaryQuantity?: string;
  isImported?: boolean;
}

export interface ElectronicsData {
  modelNumber?: string;
  productCondition?: 'New' | 'Refurbished' | 'Used';
  warranty?: boolean;
  warrantyPeriod?: string;
  countryOfOrigin?: string;
  processorType?: string;
  ram?: string;
  storageCapacity?: string;
  displaySize?: string;
  batteryCapacity?: string;
  operatingSystem?: string;
  connectivity?: string[];
  powerConsumption?: string;
  colorOptions?: string[];
  minStockAlert?: number;
  bulkPrice?: number;
  videoUrl?: string;
  threeSixtyViewUrl?: string;
  datasheetUrl?: string;
  packageWeight?: string;
  packageLength?: string;
  packageWidth?: string;
  packageHeight?: string;
  shippingClass?: string;
  deliveryTime?: string;
  bisCertification?: string;
  serialNumber?: string;
  safetyInstructions?: string;
  importerDetails?: string;
  installationRequired?: boolean;
  installationCharges?: number;
  supportContact?: string;
  manufacturerDetails?: string;
  replacementPolicy?: string;
  promotionalBanner?: string;
}

export interface FashionApparelData {
  gender?: 'Men' | 'Women' | 'Unisex' | 'Kids';
  ageGroup?: 'Adult' | 'Teen' | 'Kids' | 'Baby';
  apparelType?: string;
  availableSizes?: string[];
  sizeChartUrl?: string;
  fitType?: 'Slim Fit' | 'Regular Fit' | 'Loose Fit' | 'Oversized';
  primaryColor?: string;
  secondaryColor?: string;
  pattern?: 'Solid' | 'Printed' | 'Striped' | 'Checked' | 'Embroidered';
  sleeveType?: 'Full Sleeve' | 'Half Sleeve' | 'Sleeveless';
  neckType?: 'Round Neck' | 'V-Neck' | 'Collar';
  fabricType?: 'Cotton' | 'Polyester' | 'Denim' | 'Silk' | 'Wool' | 'Linen';
  fabricBlend?: string;
  isStretchable?: boolean;
  careInstructions?: string;
  countryOfOrigin?: string;
  occasion?: 'Casual' | 'Formal' | 'Party Wear' | 'Sports' | 'Ethnic';
  minOrderQuantity?: number;
  modelImage?: string;
  videoUrl?: string;
  packageWeight?: string;
  packageLength?: string;
  packageWidth?: string;
  packageHeight?: string;
  shippingClass?: string;
}

export interface BeautyPersonalCareData {
  keyBenefits?: string;
  ingredients?: string;
  barcode?: string;
  sizeVolume?: string;
  shadeColor?: string;
  fragranceVariant?: string;
  packSize?: string;
  skinType?: string;
  hairType?: string;
  concern?: string;
  ingredientType?: string;
  gender?: 'Men' | 'Women' | 'Unisex';
  spf?: string;
  formulation?: string;
  beforeAfterImages?: string[];
  isDermatologicallyTested?: boolean;
  isCrueltyFree?: boolean;
  isVegan?: boolean;
  isOrganic?: boolean;
  isParabenFree?: boolean;
  isSulphateFree?: boolean;
  packageWeight?: string;
  packageLength?: string;
  packageWidth?: string;
  packageHeight?: string;
  shippingClass?: string;
  deliveryTime?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  faqs?: { question: string; answer: string }[];
}

export interface HomeKitchenData {
  material?: 'Steel' | 'Plastic' | 'Glass' | 'Wood' | 'Silicone' | 'Other';
  color?: string;
  capacitySize?: string;
  usageType?: string;
  powerType?: 'Electric' | 'Manual' | 'Battery' | 'None';
  warranty?: string;
  powerConsumption?: string;
  voltage?: string;
  applianceType?: string;
  energyRating?: string;
  cleaningType?: string;
  fragrance?: string;
  isChemical?: boolean;
  isHerbal?: boolean;
  packSize?: string;
  packageWeight?: string;
  packageLength?: string;
  packageWidth?: string;
  packageHeight?: string;
  shippingCharges?: number;
}

export interface BabyKidsData {
  ageGroup?: string;
  gender?: 'Boys' | 'Girls' | 'Unisex';
  size?: string;
  color?: string;
  materialFabric?: string;
  pattern?: string;
  occasion?: string;
  safetyCertification?: string;
  isBpaFree?: boolean;
  isNonToxic?: boolean;
  countryOfOrigin?: string;
  packageWeight?: string;
  packageLength?: string;
  packageWidth?: string;
  packageHeight?: string;
  deliveryTime?: string;
}

export interface SportsFitnessData {
  keyFeatures?: string;
  material?: string;
  weight?: string;
  dimensions?: string;
  color?: string;
  size?: string;
  sportType?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Professional';
  usage?: 'Indoor' | 'Outdoor' | 'Both';
  packageWeight?: string;
  packageLength?: string;
  packageWidth?: string;
  packageHeight?: string;
  shippingClass?: 'Standard' | 'Heavy Item';
  deliveryCharges?: number;
  warranty?: string;
  returnPolicy?: string;
  certification?: string;
  countryOfOrigin?: string;
}

export interface AutomotiveData {
  vehicleType?: 'Car' | 'Bike' | 'Truck' | 'EV' | 'Other';
  compatibleBrand?: string;
  compatibleModel?: string;
  modelYear?: string;
  engineType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'Any';
  partNumber?: string;
  material?: string;
  color?: string;
  weight?: string;
  dimensions?: string;
  warrantyPeriod?: string;
  installationGuideUrl?: string;
  installationType?: 'DIY' | 'Professional Required';
  isOem?: boolean;
  returnEligibility?: boolean;
  shippingWeight?: string;
  countryOfOrigin?: string;
}

export interface BooksStationeryData {
  isbn?: string;
  author?: string;
  publisher?: string;
  language?: string;
  edition?: string;
  pages?: number;
  condition?: 'New' | 'Used';
  weight?: string;
  dimensions?: string;
  shippingWeight?: string;
  deliveryTime?: string;
  returnPolicy?: string;
  bindingType?: 'Paperback' | 'Hardcover';
  paperQuality?: string;
  stationeryMaterial?: 'Plastic' | 'Metal' | 'Paper' | 'Other';
  penType?: 'Ball' | 'Gel' | 'Fountain' | 'Other';
  notebookSize?: 'A4' | 'A5' | 'B5' | 'Other';
}

export interface HealthWellnessData {
  ingredients?: string;
  form?: 'Tablet' | 'Capsule' | 'Powder' | 'Liquid' | 'Gummies' | 'Other';
  flavor?: string;
  quantityWeight?: string;
  servingSize?: string;
  servingsPerPack?: number;
  suitableFor?: 'Men' | 'Women' | 'Kids' | 'All';
  healthBenefit?: string;
  dietaryPreference?: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan';
  isSugarFree?: boolean;
  isGlutenFree?: boolean;
  isOrganic?: boolean;
  expiryDate?: string;
  manufacturingDate?: string;
  licenseNumber?: string;
  usageInstructions?: string;
  isDoctorRecommended?: boolean;
  packageWeight?: string;
  packageDimensions?: string;
  shippingClass?: 'Standard' | 'Fragile' | 'Cold Storage';
}

export interface PetSuppliesData {
  petType?: 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Small Animals' | 'Reptiles' | 'Other';
  breedSize?: 'Small' | 'Medium' | 'Large' | 'All Sizes';
  lifeStage?: 'Puppy' | 'Kitten' | 'Adult' | 'Senior' | 'All Ages';
  material?: string;
  flavor?: string;
  weightSize?: string;
  color?: string;
  packSize?: string;
  shelfLife?: string;
  expiryDate?: string;
  ingredients?: string;
  safetyInstructions?: string;
  countryOfOrigin?: string;
  packageWeight?: string;
  packageDimensions?: string;
  shippingClass?: string;
}

export interface IndustrialBusinessData {
  modelNumber?: string;
  material?: string;
  powerSource?: 'Electric' | 'Battery' | 'Manual' | 'Hydraulic' | 'Other';
  voltage?: string;
  wattage?: string;
  capacity?: string;
  loadLimit?: string;
  finishType?: string;
  usageType?: 'Industrial' | 'Commercial' | 'Workshop' | 'General';
  isGstApplicable?: boolean;
  isInvoiceAvailable?: boolean;
  dispatchTime?: string;
  shippingMethod?: 'Courier' | 'Freight' | 'Pickup';
  isInstallationAvailable?: boolean;
  isIsoCertified?: boolean;
  isBisCertified?: boolean;
  isCeCertified?: boolean;
  warrantyPeriod?: string;
  safetyCompliance?: string;
  sparePartsAvailability?: boolean;
  maintenanceSupport?: boolean;
  datasheetUrl?: string;
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
  description?: string;
  tags: string[];
  manufacturer?: string;
  madeIn?: string;
  tax?: string | any;
  isReturnable: boolean;
  maxReturnDays?: number;
  totalAllowedQuantity: number;
  fssaiLicNo?: string;
  gstNumber?: string;
  hsnCode?: string;
  weight?: string;
  color?: string;
  size?: string;
  sku?: string;
  mainImageUrl?: string;
  mainImage?: string;
  galleryImageUrls: string[];
  galleryImages?: string[];
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
  barcode?: string;
  pharmacy?: PharmacyData;
  freshProduce?: FreshProduceData;
  grocery?: {
    unitType?: 'Kg' | 'Gram' | 'Litre' | 'Piece' | 'Packet';
    minOrderQuantity?: number;
    expiryDate?: Date | string;
    brand?: string;
  };
  electronics?: ElectronicsData;
  fashionApparel?: FashionApparelData;
  beautyPersonalCare?: BeautyPersonalCareData;
  homeKitchen?: HomeKitchenData;
  babyKids?: BabyKidsData;
  sportsFitness?: SportsFitnessData;
  automotive?: AutomotiveData;
  booksStationery?: BooksStationeryData;
  healthWellness?: HealthWellnessData;
  petSupplies?: PetSuppliesData;
  industrialBusiness?: IndustrialBusinessData;
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
  description?: string;
  tags?: string[];
  manufacturer?: string;
  madeIn?: string;
  taxId?: string;
  isReturnable: boolean;
  maxReturnDays?: number;
  totalAllowedQuantity: number;
  fssaiLicNo?: string;
  gstNumber?: string;
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
  barcode?: string;
  pharmacy?: PharmacyData;
  freshProduce?: FreshProduceData;
  grocery?: {
    unitType?: 'Kg' | 'Gram' | 'Litre' | 'Piece' | 'Packet';
    minOrderQuantity?: number;
    expiryDate?: Date | string;
    brand?: string;
  };
  electronics?: ElectronicsData;
  fashionApparel?: FashionApparelData;
  beautyPersonalCare?: BeautyPersonalCareData;
  homeKitchen?: HomeKitchenData;
  babyKids?: BabyKidsData;
  sportsFitness?: SportsFitnessData;
  automotive?: AutomotiveData;
  booksStationery?: BooksStationeryData;
  healthWellness?: HealthWellnessData;
  petSupplies?: PetSuppliesData;
  industrialBusiness?: IndustrialBusinessData;
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
  sellerId?: string;
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

export const updateStock = async (id: string, variationId: string, stock: number): Promise<ApiResponse<Product>> => {
  const response = await api.patch(`/products/${id}/stock`, { variationId, stock });
  return response.data;
};

export const deleteProduct = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const generateProductDescriptionAI = async (data: { 
  name: string; 
  category?: string; 
  tags?: string[]; 
  existingDescription?: string; 
}): Promise<ApiResponse<{ description: string }>> => {
  const response = await api.post("/ai/product-description", data);
  return response.data;
};

export const getShops = async (): Promise<ApiResponse<Shop[]>> => {
  const response = await api.get("/shops");
  return response.data;
};
