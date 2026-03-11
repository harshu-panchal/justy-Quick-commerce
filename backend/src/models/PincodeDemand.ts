import mongoose, { Schema, Document } from 'mongoose';

export interface IPincodeDemand extends Document {
    pincode: string;
    requestCount: number;
    lastRequested: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PincodeDemandSchema: Schema = new Schema(
    {
        pincode: { type: String, required: true, unique: true },
        requestCount: { type: Number, default: 1 },
        lastRequested: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const PincodeDemand = (mongoose.models.PincodeDemand as mongoose.Model<IPincodeDemand>) || mongoose.model<IPincodeDemand>('PincodeDemand', PincodeDemandSchema);

export default PincodeDemand;
