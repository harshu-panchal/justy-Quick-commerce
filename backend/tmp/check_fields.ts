import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    const Product = mongoose.model('Product', new mongoose.Schema({ 
        productName: String,
        mainImage: String,
        dynamicFields: Map 
    }, { strict: false }));
    
    const p = await Product.findById("69d7873211f5512c53221f44");
    console.log("Product state:", JSON.stringify(p, null, 2));
    process.exit(0);
};

check();
