import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  // Basic Info
  productName: string;
  smallDescription?: string;
  description?: string;

  // Categorization
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  subcategoryModel: "SubCategory" | "Category";
  subSubCategory?: mongoose.Types.ObjectId;
  headerCategoryId?: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;
  brandName?: string;

  // Seller Info
  seller: mongoose.Types.ObjectId;

  // Images
  mainImage?: string;
  galleryImages: string[];

  // Pricing & Inventory
  price: number;
  discPrice?: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  barcode?: string;

  // Variations
  variationType?: string; // e.g., 'Size', 'Color', 'Weight'
  variations?: Array<{
    name: string;
    value: string;
    price?: number;
    discPrice?: number;
    stock?: number;
    sku?: string;
    status?: string;
  }>;

  // Status Flags
  publish: boolean;
  popular: boolean;
  dealOfDay: boolean;
  status: "Active" | "Inactive" | "Pending" | "Rejected";

  // Product Details
  manufacturer?: string;
  madeIn?: string;
  tax?: string;
  fssaiLicNo?: string;
  gstNumber?: string;
  totalAllowedQuantity?: number;
  hsnCode?: string;
  weight?: string;
  color?: string;
  size?: string;

  // Return & Cancellation Policy
  isReturnable: boolean;
  maxReturnDays?: number;
  cancelAvailable: boolean;

  // SEO
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  seoImageAlt?: string;

  // Details
  pack?: string;
  shelfLife?: string;
  marketer?: string;

  // Ratings
  rating: number;
  reviewsCount: number;
  discount: number; // Calculated percentage

  returnPolicyText?: string;

  // Tags
  tags: string[];

  // Approval
  requiresApproval: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;

  // Commission
  commission?: number;

  // Shop by Store
  isShopByStoreOnly?: boolean;
  shopId?: mongoose.Types.ObjectId;

  foodType?: 'Veg' | 'Non-Veg' | 'Egg';
  preparationTime?: number; // in minutes
  timing?: string[]; // e.g., ["Breakfast", "Lunch"]
  addons?: Array<{
    name: string;
    price: number;
    inStock?: boolean;
  }>;
  availabilityStatus?: 'Available' | 'Sold out';

  pharmacy?: {
    tablets?: string;
    treatment?: string;
    form?: string;
    prescriptionRequired?: boolean;
    packOf?: string;
    dosage?: string;
    therapeuticClassification?: string;
    composition?: string;
    containerType?: string;
    salesPackage?: string;
    manufacturingDate?: Date;
    expiryDate?: Date;
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
    variant?: string;
    quantity?: string;
  };

  freshProduce?: {
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
  };

  grocery?: {
    unitType?: 'Kg' | 'Gram' | 'Litre' | 'Piece' | 'Packet';
    minOrderQuantity?: number;
    expiryDate?: Date;
    brand?: string;
  };

  electronics?: {
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
    connectivity?: string[]; // e.g. ["WiFi", "Bluetooth", "5G"]
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
  };

  fashionApparel?: {
    gender?: 'Men' | 'Women' | 'Unisex' | 'Kids';
    ageGroup?: 'Adult' | 'Teen' | 'Kids' | 'Baby';
    apparelType?: string; // T-Shirts, Shirts, Kurta, etc.
    availableSizes?: string[]; // XS, S, M, L, XL, XXL
    sizeChartUrl?: string; // URL to size chart image
    fitType?: 'Slim Fit' | 'Regular Fit' | 'Loose Fit' | 'Oversized';
    primaryColor?: string;
    secondaryColor?: string;
    pattern?: 'Solid' | 'Printed' | 'Striped' | 'Checked' | 'Embroidered';
    sleeveType?: 'Full Sleeve' | 'Half Sleeve' | 'Sleeveless';
    neckType?: 'Round Neck' | 'V-Neck' | 'Collar';
    fabricType?: 'Cotton' | 'Polyester' | 'Denim' | 'Silk' | 'Wool' | 'Linen';
    fabricBlend?: string; // e.g. "90% Cotton, 10% Lycra"
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
  };
  beautyPersonalCare?: {
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
    expiryDate?: Date;
    manufacturingDate?: Date;
    faqs?: { question: string; answer: string }[];
  };
  homeKitchen?: {
    material?: 'Steel' | 'Plastic' | 'Glass' | 'Wood' | 'Silicone' | 'Other';
    color?: string;
    capacitySize?: string;
    usageType?: string; // Kitchen, Cleaning, Laundry, Bathroom
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
  };
  babyKids?: {
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
  };
  sportsFitness?: {
    keyFeatures?: string;
    material?: string;
    weight?: string;
    dimensions?: string;
    color?: string;
    size?: string;
    sportType?: string; // Cricket, Football, Gym, Yoga, etc.
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
  };
  automotive?: {
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
  };
  booksStationery?: {
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
  };
  healthWellness?: {
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
  };
  petSupplies?: {
    petType?: 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Small Animals' | 'Reptiles' | 'Other';
    breedSize?: 'Small' | 'Medium' | 'Large' | 'All Sizes';
    lifeStage?: 'Puppy' | 'Kitten' | 'Adult' | 'Senior' | 'All Ages';
    material?: string;
    flavor?: string;
    weightSize?: string;
    color?: string;
    packSize?: string;
    shelfLife?: string;
    expiryDate?: Date;
    ingredients?: string;
    safetyInstructions?: string;
    countryOfOrigin?: string;
    packageWeight?: string;
    packageDimensions?: string;
    shippingClass?: string;
  };
  industrialBusiness?: {
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
  };

  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    // Basic Info
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    smallDescription: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Categorization
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [
        function (this: any) {
          return !this.isShopByStoreOnly;
        },
        "Category is required",
      ],
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      refPath: "subcategoryModel",
    },
    subcategoryModel: {
      type: String,
      required: true,
      enum: ["SubCategory", "Category"],
      default: "SubCategory",
    },
    subSubCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    headerCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "HeaderCategory",
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
    },
    brandName: {
      type: String,
      trim: true,
    },

    // Seller Info
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller is required"],
    },

    // Images
    mainImage: {
      type: String,
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
      validate: [
        (val: string[]) => val.length <= 5,
        "{PATH} exceeds the limit of 5 gallery images",
      ],
    },

    // Pricing & Inventory
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discPrice: {
      type: Number,
      default: 0,
      min: [0, "Discounted price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare at price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    barcode: {
      type: String,
      trim: true,
    },

    // Variations
    variationType: {
      type: String,
      trim: true,
    },
    variations: {
      type: [
        {
          name: String,
          value: String,
          price: Number,
          discPrice: { type: Number, default: 0 },
          stock: Number,
          status: {
            type: String,
            enum: ["Available", "Sold out", "In stock"],
            default: "Available",
          },
          sku: String,
        },
      ],
      default: [],
    },

    // Status Flags
    publish: {
      type: Boolean,
      default: true,
    },
    popular: {
      type: Boolean,
      default: false,
    },
    dealOfDay: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending", "Rejected"],
      default: "Pending",
    },

    // Product Details
    manufacturer: {
      type: String,
      trim: true,
    },
    madeIn: {
      type: String,
      trim: true,
    },
    tax: {
      type: String,
      trim: true,
    },
    fssaiLicNo: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    totalAllowedQuantity: {
      type: Number,
      min: [0, "Total allowed quantity cannot be negative"],
    },
    hsnCode: {
      type: String,
      trim: true,
    },
    weight: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },

    // Return & Cancellation Policy
    isReturnable: {
      type: Boolean,
      default: false,
    },
    maxReturnDays: {
      type: Number,
      min: [0, "Max return days cannot be negative"],
    },
    cancelAvailable: {
      type: Boolean,
      default: true,
    },

    // SEO
    seoTitle: {
      type: String,
      trim: true,
    },
    seoKeywords: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    seoImageAlt: {
      type: String,
      trim: true,
    },

    // Details
    pack: { type: String, trim: true },
    shelfLife: { type: String, trim: true },
    marketer: { type: String, trim: true },

    // Ratings
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },

    returnPolicyText: { type: String, trim: true },

    // Tags
    tags: {
      type: [String],
      default: [],
    },

    // Approval (removed - all products are auto-published)
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    approvedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },
    // Commission
    commission: {
      type: Number,
      min: [0, "Commission cannot be negative"],
    },

    // Shop by Store
    isShopByStoreOnly: {
      type: Boolean,
      default: false,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    foodType: {
      type: String,
      enum: ["Veg", "Non-Veg", "Egg"],
    },
    preparationTime: {
      type: Number,
      min: [1, "Preparation time must be at least 1 minute"],
    },
    timing: {
      type: [String],
      default: [],
    },
    addons: {
      type: [
        {
          name: { type: String, trim: true },
          price: { type: Number, default: 0 },
          inStock: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    availabilityStatus: {
      type: String,
      enum: ["Available", "Sold out"],
      default: "Available",
    },
    pharmacy: {
      tablets: { type: String, trim: true },
      treatment: { type: String, trim: true },
      form: { type: String, trim: true },
      prescriptionRequired: { type: Boolean, default: false },
      packOf: { type: String, trim: true },
      dosage: { type: String, trim: true },
      therapeuticClassification: { type: String, trim: true },
      composition: { type: String, trim: true },
      containerType: { type: String, trim: true },
      salesPackage: { type: String, trim: true },
      manufacturingDate: { type: Date },
      expiryDate: { type: Date },
      sideEffects: { type: String, trim: true },
      manufacturerName: { type: String, trim: true },
      howItWorks: { type: String, trim: true },
      safetyAdvice: { type: String, trim: true },
      interactions: { type: String, trim: true },
      manufacturerLicenseNo: { type: String, trim: true },
      storage: { type: String, trim: true },
      contraindications: { type: String, trim: true },
      schedule: { type: String, trim: true },
      medicineType: { type: String, trim: true },
      underDPCO: { type: Boolean, default: false },
      manufacturingProcess: { type: String, trim: true },
      manufacturerAddress: { type: String, trim: true },
      usageDescription: { type: String, trim: true },
      variant: { type: String, trim: true },
      quantity: { type: String, trim: true },
    },
    freshProduce: {
      packOf: { type: String, trim: true },
      brand: { type: String, trim: true },
      type: { type: String, trim: true },
      quantity: { type: String, trim: true },
      shelfLife: { type: String, trim: true },
      form: { type: String, trim: true },
      isOrganic: { type: Boolean, default: false },
      commonName: { type: String, trim: true },
      isWhole: { type: Boolean, default: true },
      origin: { type: String, trim: true },
      packagingType: { type: String, trim: true },
      netQuantity: { type: String, trim: true },
      addedPreservatives: { type: String, trim: true },
      secondaryQuantity: { type: String, trim: true },
      isImported: { type: Boolean, default: false },
    },
    grocery: {
      unitType: { type: String, enum: ['Kg', 'Gram', 'Litre', 'Piece', 'Packet'], default: 'Packet' },
      minOrderQuantity: { type: Number, default: 1 },
      expiryDate: { type: Date },
      brand: { type: String, trim: true },
    },
    electronics: {
      modelNumber: { type: String, trim: true },
      productCondition: { type: String, enum: ['New', 'Refurbished', 'Used'], default: 'New' },
      warranty: { type: Boolean, default: false },
      warrantyPeriod: { type: String, trim: true },
      countryOfOrigin: { type: String, trim: true },
      processorType: { type: String, trim: true },
      ram: { type: String, trim: true },
      storageCapacity: { type: String, trim: true },
      displaySize: { type: String, trim: true },
      batteryCapacity: { type: String, trim: true },
      operatingSystem: { type: String, trim: true },
      connectivity: { type: [String], default: [] },
      powerConsumption: { type: String, trim: true },
      colorOptions: { type: [String], default: [] },
      minStockAlert: { type: Number },
      bulkPrice: { type: Number },
      videoUrl: { type: String, trim: true },
      threeSixtyViewUrl: { type: String, trim: true },
      datasheetUrl: { type: String, trim: true },
      packageWeight: { type: String, trim: true },
      packageLength: { type: String, trim: true },
      packageWidth: { type: String, trim: true },
      packageHeight: { type: String, trim: true },
      shippingClass: { type: String, trim: true },
      deliveryTime: { type: String, trim: true },
      bisCertification: { type: String, trim: true },
      serialNumber: { type: String, trim: true },
      safetyInstructions: { type: String, trim: true },
      importerDetails: { type: String, trim: true },
      installationRequired: { type: Boolean, default: false },
      installationCharges: { type: Number },
      supportContact: { type: String, trim: true },
      manufacturerDetails: { type: String, trim: true },
      replacementPolicy: { type: String, trim: true },
      promotionalBanner: { type: String, trim: true },
    },
    fashionApparel: {
      gender: { type: String, enum: ['Men', 'Women', 'Unisex', 'Kids'] },
      ageGroup: { type: String, enum: ['Adult', 'Teen', 'Kids', 'Baby'] },
      apparelType: { type: String, trim: true },
      availableSizes: { type: [String], default: [] },
      sizeChartUrl: { type: String, trim: true },
      fitType: { type: String, enum: ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Oversized'] },
      primaryColor: { type: String, trim: true },
      secondaryColor: { type: String, trim: true },
      pattern: { type: String, enum: ['Solid', 'Printed', 'Striped', 'Checked', 'Embroidered'] },
      sleeveType: { type: String, enum: ['Full Sleeve', 'Half Sleeve', 'Sleeveless'] },
      neckType: { type: String, enum: ['Round Neck', 'V-Neck', 'Collar'] },
      fabricType: { type: String, enum: ['Cotton', 'Polyester', 'Denim', 'Silk', 'Wool', 'Linen'] },
      fabricBlend: { type: String, trim: true },
      isStretchable: { type: Boolean, default: false },
      careInstructions: { type: String, trim: true },
      countryOfOrigin: { type: String, trim: true },
      occasion: { type: String, enum: ['Casual', 'Formal', 'Party Wear', 'Sports', 'Ethnic'] },
      minOrderQuantity: { type: Number, default: 1 },
      modelImage: { type: String, trim: true },
      videoUrl: { type: String, trim: true },
      packageWeight: { type: String, trim: true },
      packageLength: { type: String, trim: true },
      packageWidth: { type: String, trim: true },
      packageHeight: { type: String, trim: true },
      shippingClass: { type: String, trim: true },
    },
    beautyPersonalCare: {
      keyBenefits: { type: String, trim: true },
      ingredients: { type: String, trim: true },
      barcode: { type: String, trim: true },
      sizeVolume: { type: String, trim: true },
      shadeColor: { type: String, trim: true },
      fragranceVariant: { type: String, trim: true },
      packSize: { type: String, trim: true },
      skinType: { type: String, trim: true },
      hairType: { type: String, trim: true },
      concern: { type: String, trim: true },
      ingredientType: { type: String, trim: true },
      gender: { type: String, enum: ['Men', 'Women', 'Unisex'] },
      spf: { type: String, trim: true },
      formulation: { type: String, trim: true },
      beforeAfterImages: [{ type: String }],
      isDermatologicallyTested: { type: Boolean, default: false },
      isCrueltyFree: { type: Boolean, default: false },
      isVegan: { type: Boolean, default: false },
      isOrganic: { type: Boolean, default: false },
      isParabenFree: { type: Boolean, default: false },
      isSulphateFree: { type: Boolean, default: false },
      packageWeight: { type: String, trim: true },
      packageLength: { type: String, trim: true },
      packageWidth: { type: String, trim: true },
      packageHeight: { type: String, trim: true },
      shippingClass: { type: String, trim: true },
      deliveryTime: { type: String, trim: true },
      expiryDate: { type: Date },
      manufacturingDate: { type: Date },
      faqs: [{ question: { type: String }, answer: { type: String } }],
    },
    homeKitchen: {
      material: { type: String, enum: ['Steel', 'Plastic', 'Glass', 'Wood', 'Silicone', 'Other'] },
      color: { type: String, trim: true },
      capacitySize: { type: String, trim: true },
      usageType: { type: String, trim: true },
      powerType: { type: String, enum: ['Electric', 'Manual', 'Battery', 'None'] },
      warranty: { type: String, trim: true },
      powerConsumption: { type: String, trim: true },
      voltage: { type: String, trim: true },
      applianceType: { type: String, trim: true },
      energyRating: { type: String, trim: true },
      cleaningType: { type: String, trim: true },
      fragrance: { type: String, trim: true },
      isChemical: { type: Boolean, default: false },
      isHerbal: { type: Boolean, default: false },
      packSize: { type: String, trim: true },
      packageWeight: { type: String, trim: true },
      packageLength: { type: String, trim: true },
      packageWidth: { type: String, trim: true },
      packageHeight: { type: String, trim: true },
      shippingCharges: { type: Number },
    },
    babyKids: {
      ageGroup: { type: String, trim: true },
      gender: { type: String, enum: ['Boys', 'Girls', 'Unisex'] },
      size: { type: String, trim: true },
      color: { type: String, trim: true },
      materialFabric: { type: String, trim: true },
      pattern: { type: String, trim: true },
      occasion: { type: String, trim: true },
      safetyCertification: { type: String, trim: true },
      isBpaFree: { type: Boolean, default: false },
      isNonToxic: { type: Boolean, default: false },
      countryOfOrigin: { type: String, trim: true },
      packageWeight: { type: String, trim: true },
      packageLength: { type: String, trim: true },
      packageWidth: { type: String, trim: true },
      packageHeight: { type: String, trim: true },
      deliveryTime: { type: String, trim: true },
    },
    sportsFitness: {
      keyFeatures: { type: String, trim: true },
      material: { type: String, trim: true },
      weight: { type: String, trim: true },
      dimensions: { type: String, trim: true },
      color: { type: String, trim: true },
      size: { type: String, trim: true },
      sportType: { type: String, trim: true },
      skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Professional'] },
      usage: { type: String, enum: ['Indoor', 'Outdoor', 'Both'] },
      packageWeight: { type: String, trim: true },
      packageLength: { type: String, trim: true },
      packageWidth: { type: String, trim: true },
      packageHeight: { type: String, trim: true },
      shippingClass: { type: String, enum: ['Standard', 'Heavy Item'] },
      deliveryCharges: { type: Number },
      warranty: { type: String, trim: true },
      returnPolicy: { type: String, trim: true },
      certification: { type: String, trim: true },
      countryOfOrigin: { type: String, trim: true },
    },
    automotive: {
      vehicleType: { type: String, enum: ['Car', 'Bike', 'Truck', 'EV', 'Other'] },
      compatibleBrand: { type: String, trim: true },
      compatibleModel: { type: String, trim: true },
      modelYear: { type: String, trim: true },
      engineType: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Any'] },
      partNumber: { type: String, trim: true },
      material: { type: String, trim: true },
      color: { type: String, trim: true },
      weight: { type: String, trim: true },
      dimensions: { type: String, trim: true },
      warrantyPeriod: { type: String, trim: true },
      installationGuideUrl: { type: String, trim: true },
      installationType: { type: String, enum: ['DIY', 'Professional Required'] },
      isOem: { type: Boolean, default: false },
      returnEligibility: { type: Boolean, default: true },
      shippingWeight: { type: String, trim: true },
      countryOfOrigin: { type: String, trim: true },
    },
    booksStationery: {
      isbn: { type: String, trim: true },
      author: { type: String, trim: true },
      publisher: { type: String, trim: true },
      language: { type: String, trim: true },
      edition: { type: String, trim: true },
      pages: { type: Number },
      condition: { type: String, enum: ['New', 'Used'] },
      weight: { type: String, trim: true },
      dimensions: { type: String, trim: true },
      shippingWeight: { type: String, trim: true },
      deliveryTime: { type: String, trim: true },
      returnPolicy: { type: String, trim: true },
      bindingType: { type: String, enum: ['Paperback', 'Hardcover'] },
      paperQuality: { type: String, trim: true },
      stationeryMaterial: { type: String, enum: ['Plastic', 'Metal', 'Paper', 'Other'] },
      penType: { type: String, enum: ['Ball', 'Gel', 'Fountain', 'Other'] },
      notebookSize: { type: String, enum: ['A4', 'A5', 'B5', 'Other'] },
    },
    healthWellness: {
      ingredients: { type: String, trim: true },
      form: { type: String, enum: ['Tablet', 'Capsule', 'Powder', 'Liquid', 'Gummies', 'Other'] },
      flavor: { type: String, trim: true },
      quantityWeight: { type: String, trim: true },
      servingSize: { type: String, trim: true },
      servingsPerPack: { type: Number },
      suitableFor: { type: String, enum: ['Men', 'Women', 'Kids', 'All'] },
      healthBenefit: { type: String, trim: true },
      dietaryPreference: { type: String, enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan'] },
      isSugarFree: { type: Boolean, default: false },
      isGlutenFree: { type: Boolean, default: false },
      isOrganic: { type: Boolean, default: false },
      expiryDate: { type: String, trim: true },
      manufacturingDate: { type: String, trim: true },
      licenseNumber: { type: String, trim: true },
      usageInstructions: { type: String, trim: true },
      isDoctorRecommended: { type: Boolean, default: false },
      packageWeight: { type: String, trim: true },
      packageDimensions: { type: String, trim: true },
      shippingClass: { type: String, enum: ['Standard', 'Fragile', 'Cold Storage'] },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for mrp (alias for compareAtPrice to match frontend)
ProductSchema.virtual("mrp").get(function () {
  return this.compareAtPrice;
});

// Calculate discount and sync stock/price from variations before saving
ProductSchema.pre("save", function (next) {
  // Sync price and stock from variations if they exist
  if (this.variations && this.variations.length > 0) {
    // Set price to the price of the first variation if top-level price is not set or if we want to keep it in sync
    if (this.variations[0].price !== undefined) {
      this.price = this.variations[0].price;
    }

    // Calculate total stock as sum of all variation stocks
    this.stock = this.variations.reduce(
      (acc: number, curr: any) => acc + (Number(curr.stock) || 0),
      0
    );
  }

  // Calculate discount
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    this.discount = Math.round(
      ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100
    );
  } else {
    this.discount = 0;
  }
  next();
});

// Indexes for faster queries
ProductSchema.index({ seller: 1, status: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ subcategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ publish: 1 });
// Compound indexes for common queries
ProductSchema.index({ status: 1, publish: 1 }); // For getProducts
ProductSchema.index({ category: 1, status: 1, publish: 1 }); // For category products
ProductSchema.index({ subcategory: 1, status: 1, publish: 1 }); // For subcategory products
ProductSchema.index({
  productName: "text",
  smallDescription: "text",
  description: "text",
  tags: "text",
  pack: "text",
});

const Product = (mongoose.models.Product as mongoose.Model<IProduct>) || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
