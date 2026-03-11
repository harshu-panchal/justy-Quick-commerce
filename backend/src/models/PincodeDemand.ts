import mongoose, { Schema, Document } from 'mongoose';

export interface IPincodeDemand extends Document {
    pincode: string;
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    headerCategoryId: mongoose.Types.ObjectId;
    address: string;
    createdAt: Date;
    updatedAt: Date;
}

const PincodeDemandSchema: Schema = new Schema(
    {
        pincode: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
        headerCategoryId: { type: Schema.Types.ObjectId, ref: 'HeaderCategory', required: true },
        address: { type: String, required: true },
    },
    { timestamps: true }
);

const PincodeDemand = (mongoose.models.PincodeDemand as mongoose.Model<IPincodeDemand>) || mongoose.model<IPincodeDemand>('PincodeDemand', PincodeDemandSchema);

export default PincodeDemand;
