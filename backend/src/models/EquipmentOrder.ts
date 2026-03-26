import mongoose, { Document, Schema } from "mongoose";

export interface IEquipmentOrder extends Document {
  orderNumber: string;
  seller: mongoose.Types.ObjectId;
  sellerName: string;
  sellerPhone: string;
  sellerAddress: string;
  deliveryAddress?: {
    address: string;
    city: string;
    state?: string;
    pincode: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };

  items: Array<{
    equipmentItem: mongoose.Types.ObjectId;
    name: string;
    price: number;
    imageUrl?: string;
    quantity: number;
    subtotal: number;
    deliveryCharge: number;
    platformFee: number;
  }>;

  total: number;

  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  paymentMethod: "Online" | "COD";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  status: "pending" | "approved" | "paid" | "rejected" | "cancelled" | "assigned" | "picked_up" | "delivered" | "refunded";
  rejectionReason?: string;
  cancellationReason?: string;
  refundStatus: "NONE" | "PENDING" | "REFUNDED" | "REJECTED";
  refundMethod: "BANK";
  refundRequestId?: mongoose.Types.ObjectId;
  refundTransactionId?: string;

  deliveryBoy?: mongoose.Types.ObjectId;
  assignedAt?: Date;

  // QR Logistics
  qrCodeUrl?: string;
  qrData?: string;
  isQrScanned?: boolean;
  qrGeneratedAt?: Date;
  expiresAt?: Date;
  scanLogs?: Array<{
    scannedAt: Date;
    scannedBy: mongoose.Types.ObjectId;
    location?: { lat: number; lng: number };
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const EquipmentOrderSchema = new Schema<IEquipmentOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    sellerName: { type: String, required: true },
    sellerPhone: { type: String, required: true },
    sellerAddress: { type: String, required: true },
    deliveryAddress: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      landmark: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },

    items: [
      {
        equipmentItem: {
          type: Schema.Types.ObjectId,
          ref: "EquipmentItem",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        imageUrl: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true },
        deliveryCharge: { type: Number, default: 0 },
        platformFee: { type: Number, default: 0 },
      },
    ],

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"], // Updated enum
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Online", "COD"],
      default: "Online",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpaySignature: { type: String },

    status: {
      type: String,
      enum: ["pending", "approved", "paid", "rejected", "cancelled", "assigned", "picked_up", "delivered", "refunded"],
      default: "pending",
    },
    rejectionReason: { type: String },
    cancellationReason: { type: String },
    refundStatus: { 
      type: String, 
      enum: ["NONE", "PENDING", "REFUNDED", "REJECTED"],
      default: "NONE"
    },
    refundMethod: { 
      type: String, 
      enum: ["BANK"],
      default: "BANK"
    },
    refundRequestId: {
      type: Schema.Types.ObjectId,
      ref: "RefundRequest"
    },
    refundTransactionId: { type: String },

    deliveryBoy: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
    },
    assignedAt: { type: Date },

    // QR Logistics
    qrCodeUrl: {
      type: String,
      trim: true,
    },
    qrData: {
      type: String,
      trim: true,
    },
    isQrScanned: {
      type: Boolean,
      default: false,
    },
    qrGeneratedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    scanLogs: [
      {
        scannedAt: {
          type: Date,
          default: Date.now,
        },
        scannedBy: {
          type: Schema.Types.ObjectId,
          ref: "Delivery",
        },
        location: {
          lat: Number,
          lng: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

EquipmentOrderSchema.index({ seller: 1, createdAt: -1 });
EquipmentOrderSchema.index({ status: 1 });
EquipmentOrderSchema.index({ razorpayPaymentId: 1 });

// Generate order number before validation
EquipmentOrderSchema.pre("validate", async function (this: IEquipmentOrder, next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.orderNumber = `EQ${timestamp}${random}`;
  }
  next();
});

const EquipmentOrder =
  (mongoose.models.EquipmentOrder as mongoose.Model<IEquipmentOrder>) ||
  mongoose.model<IEquipmentOrder>("EquipmentOrder", EquipmentOrderSchema);

export default EquipmentOrder;
