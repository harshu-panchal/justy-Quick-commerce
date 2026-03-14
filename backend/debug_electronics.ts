
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import Product from './src/models/Product';
import Category from './src/models/Category';
import HeaderCategory from './src/models/HeaderCategory';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function checkElectronics() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const electronicsHeader = await HeaderCategory.findOne({ name: /Electronics/i });
    console.log('Electronics Header Category:', electronicsHeader ? {
      id: electronicsHeader._id,
      name: electronicsHeader.name,
      deliveryType: electronicsHeader.deliveryType
    } : 'NOT FOUND');

    const phonesCategory = await Category.findOne({ name: /Phone/i });
    console.log('Phones Category:', phonesCategory ? {
      id: phonesCategory._id,
      name: phonesCategory.name,
      headerCategoryId: phonesCategory.headerCategoryId
    } : 'NOT FOUND');

    const sampleProduct = await Product.findOne({ productName: /phone/i })
        .populate('headerCategoryId')
        .populate({
            path: 'category',
            populate: { path: 'headerCategoryId' }
        });

    if (sampleProduct) {
        console.log('Sample Phone Product:', {
            id: sampleProduct._id,
            name: sampleProduct.productName,
            directHC: (sampleProduct.headerCategoryId as any)?.name,
            directDelType: (sampleProduct.headerCategoryId as any)?.deliveryType,
            catHC: (sampleProduct.category as any)?.headerCategoryId?.name,
            catDelType: (sampleProduct.category as any)?.headerCategoryId?.deliveryType
        });
    } else {
        console.log('No phone product found');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkElectronics();
