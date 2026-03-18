import mongoose, { Document, Schema } from "mongoose";

export type SpinResultType = "MEGA_REWARD" | "COINS";
export type SpinUserType = "Customer" | "Seller" | "DeliveryPartner";

export interface ISpinAttempt extends Document {
  campaignId: mongoose.Types.ObjectId;
  userType: SpinUserType;
  userId: mongoose.Types.ObjectId;
  // backward compatibility (older docs)
  customerId?: mongoose.Types.ObjectId;
  resultType: SpinResultType;
  coinsWon?: number;
  megaRewardName?: string;
  megaRewardImageUrl?: string;
  // bookkeeping
  blockIndex: number;
  spinNumberInBlock: number; // 1..blockSize
  createdAt: Date;
  updatedAt: Date;
}

const SpinAttemptSchema = new Schema<ISpinAttempt>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "SpinCampaign", required: true, index: true },
    userType: { type: String, enum: ["Customer", "Seller", "DeliveryPartner"], required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    // backward compatibility
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: false, index: true },
    resultType: { type: String, enum: ["MEGA_REWARD", "COINS"], required: true, index: true },
    coinsWon: { type: Number, min: 0 },
    megaRewardName: { type: String, trim: true },
    megaRewardImageUrl: { type: String, trim: true },
    blockIndex: { type: Number, required: true },
    spinNumberInBlock: { type: Number, required: true },
  },
  { timestamps: true }
);

// 24h cooldown is enforced via query (latest spin within last 24h)
SpinAttemptSchema.index({ campaignId: 1, userType: 1, userId: 1, createdAt: -1 });
SpinAttemptSchema.index({ campaignId: 1, createdAt: -1 });

export default mongoose.model<ISpinAttempt>("SpinAttempt", SpinAttemptSchema);

