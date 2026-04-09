import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    const ProductField = mongoose.model('ProductField', new mongoose.Schema({ label: String, headerCategory: mongoose.Schema.Types.ObjectId }));
    const fields = await ProductField.find({ headerCategory: "69b13f5764b2b9715d4cea47" });
    const output = fields.map(f => `${f._id}: ${f.label}`).join('\n');
    fs.writeFileSync('labels_output.txt', output);
    process.exit(0);
};

check();
