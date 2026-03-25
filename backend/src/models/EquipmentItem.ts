import mongoose, { Document, Schema } from "mongoose";

export interface IEquipmentItem extends Document {
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  minQuantity: number;
  deliveryCharge: number;
  platformFee: number;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentItemSchema = new Schema<IEquipmentItem>(
  {
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: [1, "Minimum quantity must be at least 1"],
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, "Delivery charge cannot be negative"],
    },
    platformFee: {
      type: Number,
      default: 0,
      min: [0, "Platform fee cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

EquipmentItemSchema.index({ isActive: 1 });

const EquipmentItem =
  (mongoose.models.EquipmentItem as mongoose.Model<IEquipmentItem>) ||
  mongoose.model<IEquipmentItem>("EquipmentItem", EquipmentItemSchema);

export default EquipmentItem;
