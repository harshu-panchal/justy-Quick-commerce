import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const fix = async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    const Product = mongoose.model('Product', new mongoose.Schema({ 
        mainImage: String, 
        galleryImages: [String],
        dynamicFields: Map 
    }, { strict: false }));
    
    const ProductField = mongoose.model('ProductField', new mongoose.Schema({ label: String }));
    
    const products = await Product.find({ 
        $or: [
            { mainImage: { $exists: false } },
            { mainImage: "" },
            { mainImage: null }
        ]
    });
    
    console.log(`Checking ${products.length} products...`);
    
    for (const prod of products) {
        const dynamicFields = (prod as any).dynamicFields;
        if (!dynamicFields) continue;
        
        const fieldEntries = Array.from(dynamicFields.entries());
        for (const [fieldId, value] of fieldEntries) {
            const fieldDef = await ProductField.findById(fieldId);
            if (fieldDef) {
                const label = (fieldDef as any).label.toLowerCase();
                if (label.includes('image')) {
                    const firstImage = Array.isArray(value) ? value[0] : value;
                    if (firstImage && typeof firstImage === 'string') {
                        console.log(`Fixing product ${prod._id} with image ${firstImage}`);
                        prod.mainImage = firstImage;
                        if (Array.isArray(value)) prod.galleryImages = value;
                        await prod.save();
                        break;
                    }
                }
            }
        }
    }
    
    console.log("Fix completed");
    process.exit(0);
};

fix();
