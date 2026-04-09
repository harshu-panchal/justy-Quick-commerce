import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ProductField from '../src/models/ProductField';

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/justy';

async function fixPlaceholders() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully.');

    const fields = await ProductField.find();
    console.log(`Found ${fields.length} fields to process.`);

    let updatedCount = 0;
    for (const field of fields) {
      if (!field.placeholder || field.placeholder === '') {
        let prefix = 'Enter';
        if (field.type === 'select') prefix = 'Select';
        if (field.type === 'file') prefix = 'Upload';
        if (field.type === 'date') prefix = 'Pick';
        
        const newPlaceholder = `${prefix} ${field.label}...`;
        field.placeholder = newPlaceholder;
        await field.save();
        updatedCount++;
        console.log(`Updated field "${field.label}" with placeholder: "${newPlaceholder}"`);
      }
    }

    console.log(`Success! Updated ${updatedCount} fields.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixPlaceholders();
