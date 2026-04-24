import mongoose, { Schema, model, Document } from "mongoose";

export interface IExecutive extends Document {
  name: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  referralCode: string;
  workExperience?: string;
  
  // KYC Documents
  kycDocuments?: {
    aadhaar?: string;
    pan?: string;
    resume?: string;
    bankPassbook?: string;
  };
  kycStatus: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  kycVerifiedAt?: Date;
  
  // Wallet & Status
  walletBalance: number;
  onboardedSellersCount: number;
  status: 'Pending' | 'Active' | 'Suspended';
  isOtpVerified: boolean;
  isActive: boolean; // Legacy support
  
  createdAt: Date;
  updatedAt: Date;
}

const executiveSchema = new Schema<IExecutive>(
  {
    name: {
      type: String,
      required: [true, "Executive name is required"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
    },
    alternateMobile: {
      type: String,
      trim: true,
    },
    referralCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    workExperience: {
      type: String,
      trim: true,
    },
    kycDocuments: {
      aadhaar: { type: String },
      pan: { type: String },
      resume: { type: String },
      bankPassbook: { type: String },
    },
    kycStatus: {
      type: String,
      enum: ['Pending', 'Submitted', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    kycVerifiedAt: {
      type: Date,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    onboardedSellersCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Suspended'],
      default: 'Pending',
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
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

// Pre-save hook to generate unique referral code if not present
executiveSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    let code = '';
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const namePart = (this.name || 'EXC').substring(0, 3).toUpperCase().padEnd(3, 'X');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      code = `${namePart}${randomPart}`;
      
      const existing = await mongoose.models.Executive.findOne({ referralCode: code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    this.referralCode = code;
  }
  next();
});

const Executive = mongoose.models.Executive || model<IExecutive>("Executive", executiveSchema);

export default Executive;
