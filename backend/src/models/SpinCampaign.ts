import mongoose, { Document, Schema } from "mongoose";

export interface ICoinReward {
  amount: number; // coins
}

export interface IMegaReward {
  name: string;
  imageUrl?: string;
}

export interface ISpinCampaign extends Document {
  title: string;
  isActive: boolean;
  // Guarantee: exactly 1 mega winner per `megaEveryNSpins` spins.
  megaEveryNSpins: number; // e.g. 100 or 500
  megaReward: IMegaReward;
  coinRewards: ICoinReward[]; // other wheel slices

  // Current block state
  blockSize: number;
  blockIndex: number;
  blockSpinCount: number; // 0..blockSize
  blockWinningSpinNumber: number; // 1..blockSize

  createdAt: Date;
  updatedAt: Date;
}

const SpinCampaignSchema = new Schema<ISpinCampaign>(
  {
    title: { type: String, default: "Spin & Win", trim: true },
    isActive: { type: Boolean, default: true, index: true },

    megaEveryNSpins: { type: Number, required: true, min: 2, max: 100000 },
    megaReward: {
      name: { type: String, required: true, trim: true },
      imageUrl: { type: String, trim: true },
    },
    coinRewards: [
      {
        amount: { type: Number, required: true, min: 1 },
      },
    ],

    blockSize: { type: Number, required: true, min: 2, max: 100000 },
    blockIndex: { type: Number, default: 1, min: 1 },
    blockSpinCount: { type: Number, default: 0, min: 0 },
    blockWinningSpinNumber: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true, versionKey: "__v" }
);

SpinCampaignSchema.index({ isActive: 1, updatedAt: -1 });

export default mongoose.model<ISpinCampaign>("SpinCampaign", SpinCampaignSchema);

