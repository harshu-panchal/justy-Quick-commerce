import mongoose, { Schema, model, Document } from "mongoose";

export interface IExecutive extends Document {
  name: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  referralCode: string;
  workExperience?: string;
  
  // KYC Details
  kycDetails?: {
    aadharNumber?: string;
    panNumber?: string;
    aadharFront?: string;
    aadharBack?: string;
    panCard?: string;
    resume?: string;
    bankPassbook?: string;
  };

  // Bank Details
  bankDetails?: {
    bankName?: string;
    ifscCode?: string;
    accountNumber?: string;
    accountHolderName?: string;
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
  dynamicKycData?: Record<string, any>;
  
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
    kycDetails: {
      aadharNumber: { 
        type: String, 
        trim: true,
        match: [/^[0-9]{12}$/, "Aadhar number must be 12 digits"]
      },
      panNumber: { 
        type: String, 
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN card format"]
      },
      aadharFront: { type: String },
      aadharBack: { type: String },
      panCard: { type: String },
      resume: { type: String },
      bankPassbook: { type: String },
    },
    bankDetails: {
      bankName: { type: String, trim: true },
      ifscCode: { 
        type: String, 
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"]
      },
      accountNumber: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
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
    dynamicKycData: {
      type: Schema.Types.Mixed,
      default: {},
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

// Register Alias for refPath 'EXECUTIVE'
if (!(mongoose.models.EXECUTIVE as mongoose.Model<IExecutive>)) {
  mongoose.model<IExecutive>("EXECUTIVE", executiveSchema, "executives");
}

export default Executive;
