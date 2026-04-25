import { Request, Response } from 'express';
import ExecutiveKycField from '../../../models/ExecutiveKycField';

/**
 * Get all executive KYC fields
 */
export const getExecutiveKycFields = async (req: Request, res: Response) => {
    try {
        const fields = await ExecutiveKycField.find();
        return res.status(200).json({ success: true, data: fields });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new executive KYC field
 */
export const createExecutiveKycField = async (req: Request, res: Response) => {
    try {
        const { label, type, status, options, section, placeholder, dependsOn, isRequired } = req.body;
        const newField = new ExecutiveKycField({ 
            label, 
            type, 
            status, 
            options, 
            section, 
            placeholder,
            dependsOn,
            isRequired
        });
        await newField.save();
        return res.status(201).json({ success: true, data: newField });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update an executive KYC field
 */
export const updateExecutiveKycField = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedField = await ExecutiveKycField.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedField) {
            return res.status(404).json({ success: false, message: 'Field not found' });
        }
        return res.status(200).json({ success: true, data: updatedField });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete an executive KYC field
 */
export const deleteExecutiveKycField = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedField = await ExecutiveKycField.findByIdAndDelete(id);
        if (!deletedField) {
            return res.status(404).json({ success: false, message: 'Field not found' });
        }
        return res.status(200).json({ success: true, message: 'Field deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
