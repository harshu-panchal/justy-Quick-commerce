import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryCommission extends Document {
  categoryName: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategoryCommissionSchema = new Schema<ICategoryCommission>(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Commission amount is required'],
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

const CategoryCommission = mongoose.models.CategoryCommission || mongoose.model<ICategoryCommission>('CategoryCommission', CategoryCommissionSchema);

export default CategoryCommission;
