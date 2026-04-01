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
  packagingPrice?: number;
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
    packagingPrice: {
      type: Number,
      default: 0,
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
      unitType: { type: String, enum: ['Kg', 'Gram', 'Litre', 'Piece', 'Packet'] },
      minOrderQuantity: { type: Number, default: 1 },
      expiryDate: { type: Date },
      brand: { type: String, trim: true },
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
