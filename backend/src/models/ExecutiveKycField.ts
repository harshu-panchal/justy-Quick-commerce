import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutiveKycField extends Document {
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'time' | 'checkbox' | 'multi-input' | 'file' | 'toggle';
    options?: string[];
    section?: string;
    placeholder?: string;
    status: 'Active' | 'Inactive';
    dependsOn?: {
        fieldId: mongoose.Types.ObjectId | string | null;
        value: string;
    };
    isRequired: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ExecutiveKycFieldSchema: Schema = new Schema(
    {
        label: { 
            type: String, 
            required: [true, "Field label is required"], 
            trim: true 
        },
        type: { 
            type: String, 
            enum: ['text', 'number', 'select', 'date', 'time', 'checkbox', 'multi-input', 'file', 'toggle'], 
            default: 'text' 
        },
        options: {
            type: [String],
            default: []
        },
        section: {
            type: String,
            trim: true,
            default: 'General'
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
        dependsOn: {
            fieldId: { type: Schema.Types.ObjectId, ref: 'ExecutiveKycField', default: null },
            value: { type: String, default: '' }
        },
        isRequired: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const ExecutiveKycField = (mongoose.models.ExecutiveKycField as mongoose.Model<IExecutiveKycField>) || mongoose.model<IExecutiveKycField>('ExecutiveKycField', ExecutiveKycFieldSchema);

export default ExecutiveKycField;
