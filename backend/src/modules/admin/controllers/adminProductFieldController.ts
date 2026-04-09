import { Request, Response } from 'express';
import ProductField from '../../../models/ProductField';

/**
 * Get all product fields
 */
export const getProductFields = async (req: Request, res: Response) => {
    try {
        const fields = await ProductField.find().populate('headerCategory', 'name');
        return res.status(200).json({ success: true, data: fields });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new product field
 */
export const createProductField = async (req: Request, res: Response) => {
    try {
        const { headerCategory, label, type, status, options, section, placeholder } = req.body;
        const newField = new ProductField({ 
            headerCategory, 
            label, 
            type, 
            status, 
            options, 
            section, 
            placeholder 
        });
        await newField.save();
        return res.status(201).json({ success: true, data: newField });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update a product field
 */
export const updateProductField = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedField = await ProductField.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedField) {
            return res.status(404).json({ success: false, message: 'Field not found' });
        }
        return res.status(200).json({ success: true, data: updatedField });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a product field
 */
export const deleteProductField = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedField = await ProductField.findByIdAndDelete(id);
        if (!deletedField) {
            return res.status(404).json({ success: false, message: 'Field not found' });
        }
        return res.status(200).json({ success: true, message: 'Field deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
