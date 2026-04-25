import mongoose from 'mongoose';
import Seller from '../models/Seller';
import Customer from '../models/Customer';
import Delivery from '../models/Delivery';
import Executive from '../models/Executive';

export const registerModelAliases = () => {
  try {
    // Register SELLER alias if not already registered
    if (!mongoose.models.SELLER) {
      mongoose.model('SELLER', Seller.schema, 'sellers');
    }

    // Register CUSTOMER alias if not already registered
    if (!mongoose.models.CUSTOMER) {
      mongoose.model('CUSTOMER', Customer.schema, 'customers');
    }

    // Register DELIVERY_BOY alias if not already registered
    if (!mongoose.models.DELIVERY_BOY) {
      mongoose.model('DELIVERY_BOY', Delivery.schema, 'deliveries');
    }

    // Register EXECUTIVE alias if not already registered
    if (!mongoose.models.EXECUTIVE) {
      mongoose.model('EXECUTIVE', Executive.schema, 'executives');
    }

    console.log('✓ Model Aliases Registered');
  } catch (error) {
    console.error('✗ Failed to register model aliases:', error);
  }
};
