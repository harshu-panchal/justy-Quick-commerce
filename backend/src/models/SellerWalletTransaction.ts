import mongoose, { Document, Schema } from 'mongoose';

export interface ISellerWalletTransaction extends Document {
    sellerId: mongoose.Types.ObjectId;
    amount: number;
    type: 'Credit' | 'Debit';
    reason: string;
    orderId?: string;
    note?: string;
    createdBy: mongoose.Types.ObjectId; // adminId
    createdAt: Date;
    updatedAt: Date;
}

const SellerWalletTransactionSchema = new Schema<ISellerWalletTransaction>(
    {
        sellerId: {
            type: Schema.Types.ObjectId,
            ref: 'Seller',
            required: [true, 'Seller ID is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        type: {
            type: String,
            enum: ['Credit', 'Debit'],
            required: [true, 'Transaction type is required'],
        },
        reason: {
            type: String,
            required: [true, 'Reason is required'],
            trim: true,
        },
        orderId: {
            type: String,
            trim: true,
        },
        note: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            required: [true, 'Admin ID is required'],
        },
    },
    {
        timestamps: true,
    }
);

SellerWalletTransactionSchema.index({ sellerId: 1, createdAt: -1 });
SellerWalletTransactionSchema.index({ type: 1 });

const SellerWalletTransaction = mongoose.models.SellerWalletTransaction || mongoose.model<ISellerWalletTransaction>('SellerWalletTransaction', SellerWalletTransactionSchema);

export default SellerWalletTransaction;
