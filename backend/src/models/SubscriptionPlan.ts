import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  description: string;
  type: 'Customer' | 'Seller' | 'Delivery';
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  cardColor: string; // Hex or Gradient
  status: boolean;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["Customer", "Seller"],
      required: true,
    },
    price: { type: Number, required: true },
    interval: { type: String, enum: ['monthly', 'yearly'], required: true },
    features: [{ type: String }],
    cardColor: { type: String, default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    status: { type: Boolean, default: true },
    icon: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
