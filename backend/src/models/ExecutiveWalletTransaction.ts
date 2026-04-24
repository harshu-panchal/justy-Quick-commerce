import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutiveWalletTransaction extends Document {
  executive: mongoose.Types.ObjectId;
  type: 'Credit' | 'Debit';
  amount: number;
  description: string;
  source?: 'Commission' | 'Withdrawal' | 'Correction';
  referenceId?: mongoose.Types.ObjectId; // ID of Seller or WithdrawalRequest
  balanceAfter: number;
  createdAt: Date;
}

const ExecutiveWalletTransactionSchema = new Schema<IExecutiveWalletTransaction>(
  {
    executive: {
      type: Schema.Types.ObjectId,
      ref: 'Executive',
      required: true,
    },
    type: {
      type: String,
      enum: ['Credit', 'Debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['Commission', 'Withdrawal', 'Correction'],
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const ExecutiveWalletTransaction = mongoose.models.ExecutiveWalletTransaction || mongoose.model<IExecutiveWalletTransaction>('ExecutiveWalletTransaction', ExecutiveWalletTransactionSchema);

export default ExecutiveWalletTransaction;
