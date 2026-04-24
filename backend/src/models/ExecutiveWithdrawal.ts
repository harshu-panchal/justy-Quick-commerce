import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutiveWithdrawal extends Document {
  executive: mongoose.Types.ObjectId;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifsc: string;
  };
  requestDate: Date;
  processedDate?: Date;
  adminNote?: string;
  transactionId?: string;
}

const ExecutiveWithdrawalSchema = new Schema<IExecutiveWithdrawal>(
  {
    executive: {
      type: Schema.Types.ObjectId,
      ref: 'Executive',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least 1'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
      default: 'Pending',
    },
    bankDetails: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      ifsc: { type: String, required: true },
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    processedDate: {
      type: Date,
    },
    adminNote: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ExecutiveWithdrawal = mongoose.models.ExecutiveWithdrawal || mongoose.model<IExecutiveWithdrawal>('ExecutiveWithdrawal', ExecutiveWithdrawalSchema);

export default ExecutiveWithdrawal;
