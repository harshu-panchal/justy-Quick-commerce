import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const fix = async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    const Product = mongoose.model('Product', new mongoose.Schema({ 
        productName: String,
        price: Number,
        stock: Number,
        description: String,
        mainImage: String, 
        galleryImages: [String],
        dynamicFields: Map 
    }, { strict: false }));
    
    const ProductField = mongoose.model('ProductField', new mongoose.Schema({ label: String }));
    
    const products = await Product.find({});
    
    console.log(`Checking ${products.length} products to sync missing core fields...`);
    
    for (const prod of products) {
        const dynamicFields = (prod as any).dynamicFields;
        if (!dynamicFields) continue;
        
        let updated = false;
        const fieldEntries = Array.from(dynamicFields.entries());
        for (const [fieldId, value] of fieldEntries) {
            const fieldDef = await ProductField.findById(fieldId);
            if (fieldDef) {
                const label = (fieldDef as any).label.toLowerCase();
                
                // Name
                if (label.includes('product name') && (!prod.productName || prod.productName === "")) {
                    prod.productName = value as string;
                    updated = true;
                }
                // Price
                if (label === 'price' && (!prod.price || prod.price === 0)) {
                    prod.price = Number(value);
                    updated = true;
                }
                // Stock
                if (label === 'stock' && (!prod.stock || prod.stock === 0)) {
                    prod.stock = Number(value);
                    updated = true;
                }
                // Image
                if (label.includes('image') && (!prod.mainImage || prod.mainImage === "")) {
                    const firstImage = Array.isArray(value) ? value[0] : value;
                    if (firstImage && typeof firstImage === 'string') {
                        prod.mainImage = firstImage;
                        if (Array.isArray(value)) (prod as any).galleryImages = value;
                        updated = true;
                    }
                }
            }
        }
        
        if (updated) {
            console.log(`Updated core fields for product: ${prod._id} (${prod.productName})`);
            await prod.save();
        }
    }
    
    console.log("Full sync completed");
    process.exit(0);
};

fix();
