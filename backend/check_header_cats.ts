import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || '';

async function check() {
    await mongoose.connect(mongoUri);
    const HeaderCategory = mongoose.connection.collection('headercategories');
    const all = await HeaderCategory.find({}).toArray();
    console.log('Header Categories:', all.map(c => ({ name: c.name, slug: c.slug })));
    await mongoose.disconnect();
}

check().catch(console.error);
