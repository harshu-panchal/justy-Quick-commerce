import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import HeaderCategory from '../src/models/HeaderCategory';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    const categories = await HeaderCategory.find();
    console.log(`Found ${categories.length} header categories:`);
    categories.forEach(c => {
      console.log(`- ${c.name} (${c.status})`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

check();
