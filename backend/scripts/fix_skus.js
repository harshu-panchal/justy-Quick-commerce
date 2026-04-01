
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixSKUs() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const Product = mongoose.connection.collection('products');
        
        // Find products with empty string or null SKU
        const result = await Product.updateMany(
            { $or: [{ sku: "" }, { sku: null }] },
            { $unset: { sku: "" } }
        );

        console.log(`Matched ${result.matchedCount} products. Updated ${result.modifiedCount} products.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixSKUs();
