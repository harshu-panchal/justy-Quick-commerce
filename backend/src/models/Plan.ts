import mongoose, { Schema, Document } from "mongoose";

export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type PlanType = "Customer" | "Seller" | "DeliveryPartner";

export interface IPlan extends Document {
  planType: PlanType;
  name: string;
  points?: string[];
  amount: number; // INR rupees
  currency: "INR";
  period: BillingPeriod;
  isActive: boolean;
  razorpayPlanId: string;
  previousRazorpayPlanIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    planType: {
      type: String,
      enum: ["Customer", "Seller", "DeliveryPartner"],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    points: [{ type: String, trim: true }],
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["INR"], default: "INR" },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    razorpayPlanId: { type: String, required: true, index: true },
    previousRazorpayPlanIds: [{ type: String }],
  },
  { timestamps: true }
);

PlanSchema.index({ planType: 1, isActive: 1, createdAt: -1 });

export default mongoose.model<IPlan>("Plan", PlanSchema);

