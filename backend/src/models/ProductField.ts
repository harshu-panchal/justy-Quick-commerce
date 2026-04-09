import mongoose, { Schema, Document } from 'mongoose';

export interface IProductField extends Document {
    headerCategory: mongoose.Types.ObjectId;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'time' | 'checkbox';
    options?: string[];
    section?: string;
    placeholder?: string;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

const ProductFieldSchema: Schema = new Schema(
    {
        headerCategory: { 
            type: Schema.Types.ObjectId, 
            ref: 'HeaderCategory', 
            required: [true, "Header category is required"] 
        },
        label: { 
            type: String, 
            required: [true, "Field label is required"], 
            trim: true 
        },
        type: { 
            type: String, 
            enum: ['text', 'number', 'select', 'date', 'time', 'checkbox', 'multi-input', 'file'], 
            default: 'text' 
        },
        options: {
            type: [String],
            default: []
        },
        section: {
            type: String,
            trim: true,
            default: 'General Information'
        },
        placeholder: {
            type: String,
            trim: true,
            default: ''
        },
        status: { 
            type: String, 
            enum: ['Active', 'Inactive'], 
            default: 'Active' 
        },
    },
    { timestamps: true }
);

const ProductField = (mongoose.models.ProductField as mongoose.Model<IProductField>) || mongoose.model<IProductField>('ProductField', ProductFieldSchema);

export default ProductField;
