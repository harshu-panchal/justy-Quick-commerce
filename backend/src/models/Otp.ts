import mongoose, { Document, Schema } from 'mongoose';

export type UserType = 'Admin' | 'Seller' | 'Customer' | 'Delivery' | 'Executive';

export interface IOtp extends Document {
  mobile?: string;
  email?: string;
  otp: string;
  userType: UserType;
  expiresAt: Date;
  isVerified: boolean;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    mobile: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Mobile number must be 10 digits',
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
      trim: true,
    },
    userType: {
      type: String,
      required: [true, 'User type is required'],
      enum: ['Admin', 'Seller', 'Customer', 'Delivery', 'Executive'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for quick lookup
OtpSchema.index({ mobile: 1, userType: 1 });
OtpSchema.index({ email: 1, userType: 1 });

const Otp = (mongoose.models.Otp as mongoose.Model<IOtp>) || mongoose.model<IOtp>('Otp', OtpSchema);

export default Otp;

