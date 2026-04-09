import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  // Core classification (minimal static fields)
  productName?: string;
  smallDescription?: string;
  description?: string;

  category?: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  subcategoryModel?: "SubCategory" | "Category";
  subSubCategory?: mongoose.Types.ObjectId;
  headerCategoryId?: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;
  brandName?: string;

  // Seller (only truly required field — set by auth)
  seller: mongoose.Types.ObjectId;

  // Images
  mainImage?: string;
  galleryImages?: string[];

  // Pricing & Inventory
  price: number;
  discPrice?: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  barcode?: string;

  // Variations (optional)
  variationType?: string;
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
  isReturnable: boolean;
  cancelAvailable: boolean;
  maxReturnDays?: number;
  status: "Active" | "Inactive" | "Pending" | "Rejected";

  // Approval
  requiresApproval: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;

  // Ratings (system-managed)
  rating: number;
  reviewsCount: number;
  discount: number;

  // Tags
  tags?: string[];

  // Commission
  commission?: number;

  // Shop by Store
  isShopByStoreOnly?: boolean;
  shopId?: mongoose.Types.ObjectId;

  // Availability
  availabilityStatus?: 'Available' | 'Sold out';

  // ★ ALL product data goes here — fully dynamic, admin-configured per category
  dynamicFields?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    // Basic Info — all optional, can come from dynamicFields
    productName: { type: String, trim: true, default: "" },
    smallDescription: { type: String, trim: true },
    description: { type: String, trim: true },

    // Classification
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    subcategory: { type: Schema.Types.ObjectId, refPath: "subcategoryModel" },
    subcategoryModel: {
      type: String,
      enum: ["SubCategory", "Category"],
      default: "SubCategory",
    },
    subSubCategory: { type: Schema.Types.ObjectId, ref: "Category" },
    headerCategoryId: { type: Schema.Types.ObjectId, ref: "HeaderCategory" },
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },
    brandName: { type: String, trim: true },

    // Seller — only truly required field
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller is required"],
    },

    // Images
    mainImage: { type: String, trim: true },
    galleryImages: { type: [String], default: [] },

    // Pricing & Inventory — optional with defaults
    price: { type: Number, default: 0, min: [0, "Price cannot be negative"] },
    discPrice: { type: Number, default: 0, min: [0, "Discounted price cannot be negative"] },
    compareAtPrice: { type: Number, min: [0, "Compare at price cannot be negative"] },
    stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] },
    sku: { type: String, trim: true, unique: true, sparse: true },
    barcode: { type: String, trim: true },

    // Variations
    variationType: { type: String, trim: true },
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
    publish: { type: Boolean, default: false },
    popular: { type: Boolean, default: false },
    dealOfDay: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending", "Rejected"],
      default: "Pending",
    },

    // Return & Cancellation
    isReturnable: { type: Boolean, default: true },
    cancelAvailable: { type: Boolean, default: true },
    maxReturnDays: { type: Number, default: 7 },

    // Approval
    requiresApproval: { type: Boolean, default: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true },

    // System-managed fields
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },

    // Tags
    tags: { type: [String], default: [] },

    // Commission
    commission: { type: Number, min: [0, "Commission cannot be negative"] },

    // Shop by Store
    isShopByStoreOnly: { type: Boolean, default: false },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop" },

    // Availability
    availabilityStatus: {
      type: String,
      enum: ["Available", "Sold out"],
      default: "Available",
    },

    // ★ ALL product-specific data — fully dynamic, admin-configured per category
    // This replaces all the old hardcoded category schemas
    // (pharmacy, electronics, fashion, grocery, freshProduce, etc.)
    dynamicFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: false, // Allow any extra fields not in schema to be saved
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
    if (this.variations[0].price !== undefined) {
      this.price = this.variations[0].price;
    }
    this.stock = this.variations.reduce(
      (acc: number, curr: any) => acc + (Number(curr.stock) || 0),
      0
    );
  }

  // Calculate discount
  if (this.compareAtPrice && this.price && this.compareAtPrice > this.price) {
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
ProductSchema.index({ status: 1, publish: 1 });
ProductSchema.index({ category: 1, status: 1, publish: 1 });
ProductSchema.index({ subcategory: 1, status: 1, publish: 1 });
ProductSchema.index({
  productName: "text",
  smallDescription: "text",
  description: "text",
  tags: "text",
});

const Product = (mongoose.models.Product as mongoose.Model<IProduct>) || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
