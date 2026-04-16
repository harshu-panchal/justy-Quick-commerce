import mongoose, { Schema, model, Document } from "mongoose";

export interface IExecutive extends Document {
  name: string;
  mobile?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const executiveSchema = new Schema<IExecutive>(
  {
    name: {
      type: String,
      required: [true, "Executive name is required"],
      trim: true,
      unique: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Executive = mongoose.models.Executive || model<IExecutive>("Executive", executiveSchema);

export default Executive;
