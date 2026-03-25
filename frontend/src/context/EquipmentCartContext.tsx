import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EquipmentItem } from '../services/api/seller/sellerEquipmentService';

interface CartItem extends EquipmentItem {
  quantity: number;
}

interface EquipmentCartContextType {
  cart: Record<string, number>; // id -> quantity
  cartItems: CartItem[];
  addToCart: (item: EquipmentItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

const EquipmentCartContext = createContext<EquipmentCartContextType | undefined>(undefined);

const STORAGE_KEY = 'seller_equipment_cart';

export function EquipmentCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (item: EquipmentItem) => {
    setItems(prev => {
      const existing = prev.find(i => i._id === item._id);
      const minQty = item.minQuantity || 1;
      
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: minQty }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(i => i._id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = items.find(i => i._id === itemId);
    if (!item) return;

    const minQty = item.minQuantity || 1;

    if (quantity < minQty) {
      if (window.confirm(`Minimum order quantity for this item is ${minQty}. Remove from cart?`)) {
        removeFromCart(itemId);
      }
      return;
    }

    if (quantity > item.stock) {
        alert(`Only ${item.stock} items available in stock.`);
        return;
    }

    setItems(prev => prev.map(i => i._id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cart = items.reduce((acc, item) => ({ ...acc, [item._id]: item.quantity }), {});
  const cartTotal = items.reduce((sum, item) => sum + ((item.price + (item.deliveryCharge || 0) + (item.platformFee || 0)) * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <EquipmentCartContext.Provider value={{
      cart,
      cartItems: items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      itemCount
    }}>
      {children}
    </EquipmentCartContext.Provider>
  );
}

export function useEquipmentCart() {
  const context = useContext(EquipmentCartContext);
  if (context === undefined) {
    throw new Error('useEquipmentCart must be used within an EquipmentCartProvider');
  }
  return context;
}
