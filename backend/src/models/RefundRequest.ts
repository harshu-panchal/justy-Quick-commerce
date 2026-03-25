import mongoose, { Document, Schema } from 'mongoose';

export interface IRefundRequest extends Document {
  orderId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  refundMethod: 'BANK';
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNote?: string;
  transactionRef?: string;
  refundDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefundRequestSchema = new Schema<IRefundRequest>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'EquipmentOrder',
      required: true,
      unique: true, // Only one refund request per order
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundMethod: {
      type: String,
      enum: ['BANK'],
      default: 'BANK',
      required: true,
    },
    bankDetails: {
      accountHolderName: { type: String, required: true },
      accountNumber: { type: String },
      ifscCode: { type: String },
      upiId: { type: String },
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
    },
    adminNote: { type: String },
    transactionRef: { type: String },
    refundDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

RefundRequestSchema.index({ sellerId: 1, status: 1 });
RefundRequestSchema.index({ status: 1 });

const RefundRequest = mongoose.models.RefundRequest || mongoose.model<IRefundRequest>('RefundRequest', RefundRequestSchema);

export default RefundRequest;
