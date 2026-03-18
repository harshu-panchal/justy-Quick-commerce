import mongoose, { Document, Schema } from "mongoose";

export type SubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "pending"
  | "halted"
  | "cancelled"
  | "completed"
  | "expired"
  | "failed";

export interface IDeliverySubscription extends Document {
  deliveryId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  razorpayPlanId: string;
  razorpaySubscriptionId: string;
  razorpayPaymentId?: string;
  razorpaySubscriptionObject?: any;
  razorpayLastPaymentObject?: any;
  webhookEvents?: Array<{ receivedAt: Date; event: string; payload: any }>;
  status: SubscriptionStatus;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySubscriptionSchema = new Schema<IDeliverySubscription>(
  {
    deliveryId: { type: Schema.Types.ObjectId, ref: "Delivery", required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true, index: true },
    razorpayPlanId: { type: String, required: true, index: true },
    razorpaySubscriptionId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String },
    razorpaySubscriptionObject: { type: Schema.Types.Mixed },
    razorpayLastPaymentObject: { type: Schema.Types.Mixed },
    webhookEvents: [
      {
        receivedAt: { type: Date, default: Date.now },
        event: { type: String },
        payload: { type: Schema.Types.Mixed },
      },
    ],
    status: {
      type: String,
      enum: ["created", "authenticated", "active", "pending", "halted", "cancelled", "completed", "expired", "failed"],
      default: "created",
      index: true,
    },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true }
);

DeliverySubscriptionSchema.index({ deliveryId: 1, status: 1, createdAt: -1 });

export default mongoose.model<IDeliverySubscription>("DeliverySubscription", DeliverySubscriptionSchema);

