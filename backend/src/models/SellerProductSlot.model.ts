import mongoose, { Document, Schema } from 'mongoose';

export interface ISellerProductSlot extends Document {
  sellerId: mongoose.Types.ObjectId;
  slotsPurchased: number;
  amountPaid: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const SellerProductSlotSchema = new Schema<ISellerProductSlot>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    slotsPurchased: {
      type: Number,
      required: true,
      min: 1,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SellerProductSlotSchema.index({ sellerId: 1 });
SellerProductSlotSchema.index({ status: 1 });
SellerProductSlotSchema.index({ razorpayOrderId: 1 }, { unique: true });

const SellerProductSlot =
  (mongoose.models.SellerProductSlot as mongoose.Model<ISellerProductSlot>) ||
  mongoose.model<ISellerProductSlot>('SellerProductSlot', SellerProductSlotSchema);

export { SellerProductSlot };
export default SellerProductSlot;
