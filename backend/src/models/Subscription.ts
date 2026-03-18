import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  subscriberId: mongoose.Schema.Types.ObjectId;
  subscriberType: 'Customer' | 'Seller' | 'Delivery';
  planId: mongoose.Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'Expired' | 'Cancelled';
  paymentId?: mongoose.Schema.Types.ObjectId;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    subscriberId: { type: Schema.Types.ObjectId, required: true, refPath: 'subscriberType' },
    subscriberType: { type: String, enum: ['Customer', 'Seller', 'Delivery'], required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
