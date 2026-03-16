import { Product } from './domain';

export interface CartItem {
  id?: string;
  _id?: string;
  product?: Product;
  comboOffer?: any;
  quantity: number;
  variant?: any;
  deliveryType?: 'quick' | 'scheduled';
}

export interface Cart {
  items: CartItem[];
  totalItemCount?: number;
  itemCount?: number;
  total: number;
  estimatedDeliveryFee?: number;
  platformFee?: number;
  freeDeliveryThreshold?: number;
  debug_config?: any;
  backendTotal?: number;
}
