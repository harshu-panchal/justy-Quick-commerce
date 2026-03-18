import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
    title: string;
    imageUrl: string;
    type: 'quick' | 'scheduled';
    isActive: boolean;
    linkType?: 'category' | 'product' | 'external' | 'none';
    linkValue?: string;
    createdAt: Date;
}

const BannerSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        imageUrl: { type: String, required: true },
        type: { type: String, enum: ['quick', 'scheduled'], required: true },
        isActive: { type: Boolean, default: true },
        linkType: { type: String, enum: ['category', 'product', 'external', 'none'], default: 'none' },
        linkValue: { type: String, default: '' },
    },
    { timestamps: true }
);

// Index for getting banners by type and active status
BannerSchema.index({ type: 1, isActive: 1 });

const Banner = (mongoose.models.Banner as mongoose.Model<IBanner>) || mongoose.model<IBanner>('Banner', BannerSchema);
export default Banner;
