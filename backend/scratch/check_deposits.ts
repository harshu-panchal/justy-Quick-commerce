
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const HeaderCategorySchema = new mongoose.Schema({
    name: String,
    securityDeposit: Number
});

const HeaderCategory = mongoose.model('HeaderCategory', HeaderCategorySchema);

const AppSettingsSchema = new mongoose.Schema({
    sellerSecurityDeposit: Number
});

const AppSettings = mongoose.model('AppSettings', AppSettingsSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to DB');

        const categories = await HeaderCategory.find({});
        console.log('Header Categories:', categories.map(c => ({ name: c.name, deposit: c.securityDeposit })));

        const settings = await AppSettings.findOne({});
        console.log('App Settings Seller Security Deposit:', settings?.sellerSecurityDeposit);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
