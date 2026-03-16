import mongoose, { Document, Schema } from "mongoose";

export interface ISellerCategoryCommission extends Document {
  seller: mongoose.Types.ObjectId;
  headerCategory: mongoose.Types.ObjectId;
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const SellerCategoryCommissionSchema = new Schema<ISellerCategoryCommission>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: [true, "Seller is required"],
    },
    headerCategory: {
      type: Schema.Types.ObjectId,
      ref: "HeaderCategory",
      required: [true, "Header Category is required"],
    },
    commissionRate: {
      type: Number,
      required: [true, "Commission rate is required"],
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: One commission rate per seller per category
SellerCategoryCommissionSchema.index({ seller: 1, headerCategory: 1 }, { unique: true });

const SellerCategoryCommission =
  (mongoose.models.SellerCategoryCommission as mongoose.Model<ISellerCategoryCommission>) ||
  mongoose.model<ISellerCategoryCommission>("SellerCategoryCommission", SellerCategoryCommissionSchema);

export default SellerCategoryCommission;
