import mongoose, { Schema, Document } from 'mongoose';

export interface IPincodeDemand extends Document {
    pincode: string;
    userId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    sellerId?: mongoose.Types.ObjectId;
    headerCategoryId?: mongoose.Types.ObjectId;
    address?: string;
    count: number;
    createdAt: Date;
    updatedAt: Date;
}

const PincodeDemandSchema: Schema = new Schema(
    {
        pincode: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'Customer' },
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        sellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
        headerCategoryId: { type: Schema.Types.ObjectId, ref: 'HeaderCategory' },
        address: { type: String },
        count: { type: Number, default: 1 },
    },
    { timestamps: true }
);

const PincodeDemand = (mongoose.models.PincodeDemand as mongoose.Model<IPincodeDemand>) || mongoose.model<IPincodeDemand>('PincodeDemand', PincodeDemandSchema);

export default PincodeDemand;
