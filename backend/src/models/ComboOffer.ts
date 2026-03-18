import mongoose, { Document, Schema } from "mongoose";

export interface IComboOffer extends Document {
  name: string;
  description?: string;
  mainProduct: mongoose.Types.ObjectId; // Original Product
  comboProducts: mongoose.Types.ObjectId[]; // Supplemental Products
  comboPrice: number;
  originalPrice: number;
  image?: string;
  sellerId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  creatorType: "admin" | "seller";
  isApproved: boolean;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComboOfferSchema = new Schema<IComboOffer>(
  {
    name: {
      type: String,
      required: [true, "Combo name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    mainProduct: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Main product is required"],
    },
    comboProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "At least one combo product is required"],
      },
    ],
    comboPrice: {
      type: Number,
      required: [true, "Combo price is required"],
      min: [1, "Combo price must be at least 1"],
    },
    originalPrice: {
      type: Number,
      required: [true, "Original price is required"],
      min: [1, "Original price must be at least 1"],
    },
    image: {
      type: String,
      default: "",
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller ID is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    creatorType: {
      type: String,
      enum: ["admin", "seller"],
      default: "admin",
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
ComboOfferSchema.index({ sellerId: 1 });
ComboOfferSchema.index({ isActive: 1 });

const ComboOffer =
  mongoose.models.ComboOffer ||
  mongoose.model<IComboOffer>("ComboOffer", ComboOfferSchema);

export default ComboOffer;
