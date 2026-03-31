import mongoose, { Document, Schema } from "mongoose";

export interface IComplaint extends Document {
  customer: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  seller?: mongoose.Types.ObjectId;
  
  category: "Delivery" | "Product" | "Payment" | "Refund" | "App/Technical" | "Other";
  subject: string;
  message: string;
  images?: string[];
  
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  
  response?: string;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
    },
    category: {
      type: String,
      enum: ["Delivery", "Product", "Payment", "Refund", "App/Technical", "Other"],
      default: "Other",
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    response: {
      type: String,
      trim: true,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ComplaintSchema.index({ customer: 1 });
ComplaintSchema.index({ seller: 1 });
ComplaintSchema.index({ status: 1 });

const Complaint = (mongoose.models.Complaint as mongoose.Model<IComplaint>) || mongoose.model<IComplaint>("Complaint", ComplaintSchema);

export default Complaint;
