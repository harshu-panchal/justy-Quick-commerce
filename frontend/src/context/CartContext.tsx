import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useLocation } from '../hooks/useLocation';
import { Cart, CartItem } from '../types/cart';
import { Product } from '../types/domain';
import {
  getCart,
  addToCart as apiAddToCart,
  addComboToCart as apiAddComboToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart
} from '../services/api/customerCartService';
import { calculateProductPrice } from '../utils/priceUtils';

const CART_STORAGE_KEY = 'saved_cart';

interface AddToCartEvent {
  product: Product;
  sourcePosition?: { x: number; y: number };
}

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, sourceElement?: HTMLElement | null) => Promise<void>;
  addComboToCart: (comboId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string, variantTitle?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: (latitude?: number, longitude?: number) => Promise<void>;
  lastAddEvent: AddToCartEvent | null;
  loading: boolean;
  isOperating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Extended interface to include Cart Item ID
interface ExtendedCartItem extends CartItem {
  id?: string;
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage for persistence on refresh
  const [items, setItems] = useState<ExtendedCartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out items with null/undefined products AND null/undefined combos (corrupted localStorage data)
        return Array.isArray(parsed) ? parsed.filter((item: any) => item?.product || item?.comboOffer) : [];
      } catch (e) {
        console.error("Failed to parse saved cart", e);
      }
    }
    return [];
  });
  const [lastAddEvent, setLastAddEvent] = useState<AddToCartEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const pendingOperationsRef = useRef<Set<string>>(new Set());

  const { isAuthenticated, user } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast();

  // Helper to map API cart items to internal CartItem structure
  const mapApiItemsToState = (apiItems: any[]): ExtendedCartItem[] => {
    return apiItems
      .filter((item: any) => item.product || item.comboOffer) // Safety filter
      .map((item: any) => {
        const base = {
          id: item._id, // Store CartItem ID
          quantity: item.quantity,
          variant: item.variation
        };

        if (item.comboOffer) {
          return {
            ...base,
            comboOffer: {
              ...item.comboOffer,
              id: item.comboOffer._id,
              // Map populated products if available
              comboProducts: item.comboOffer.comboProducts?.map((cp: any) => ({
                ...cp,
                product: cp.product ? {
                  ...cp.product,
                  id: cp.product._id,
                  name: cp.product.productName || cp.product.name
                } : null
              }))
            }
          };
        }

        if (!item.product) return null;

        // Determine delivery type using the same logic as backend
        const product = item.product;
        const isScheduled =
          product.headerCategoryId?.deliveryType === 'scheduled' ||
          product.category?.headerCategoryId?.deliveryType === 'scheduled' ||
          product.subcategory?.headerCategoryId?.deliveryType === 'scheduled';

        return {
          ...base,
          product: {
            id: product._id, // Map _id to id
            name: product.productName || product.name,
            price: product.price,
            mrp: product.mrp,
            discPrice: product.discPrice,
            variations: product.variations,
            imageUrl: product.mainImage || product.imageUrl,
            pack: product.pack || '1 unit',
            categoryId: product.category?._id || product.category || '',
            description: product.description,
            variantId: item.variation // Preserving variation ID/value
          },
          deliveryType: isScheduled ? 'scheduled' : 'quick' as 'quick' | 'scheduled'
        };
      })
      .filter((item): item is any => item !== null);
  };

// Sync to localStorage whenever items change
useEffect(() => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}, [items]);

// Helper to sync cart from API
const fetchCart = async (lat?: number, lng?: number) => {
  if (!isAuthenticated || user?.userType !== 'Customer') {
    // If we cleared it above but had things in localStorage, we keep them for guests?
    // For now, if logged out, we clear if it was an authenticated session.
    // But if guest, we might want to keep it.
    // Let's only clear if we are transition from logged in to logged out.
    setLoading(false);
    return;
  }

  try {
    // Use provided coordinates or fallback to current location
    const queryLat = lat !== undefined ? lat : location?.latitude;
    const queryLng = lng !== undefined ? lng : location?.longitude;

    const response = await getCart({
      latitude: queryLat,
      longitude: queryLng
    });
    if (response && response.data && response.data.items) {
      setItems(mapApiItemsToState(response.data.items));
      setEstimatedFee(response.data.estimatedDeliveryFee);
      setPlatformFee(response.data.platformFee);
      setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
      (items as any).debug_config = response.data.debug_config; // Hack to pass it through
      (items as any).backendTotal = response.data.backendTotal; // Hack to pass backend total
    } else {
      setItems([]);
      setEstimatedFee(undefined);
      setPlatformFee(undefined);
      setFreeDeliveryThreshold(undefined);
    }
  } catch (error) {
    console.error("Failed to fetch cart:", error);
  } finally {
    setLoading(false);
  }
};

// Load cart on auth change
useEffect(() => {
  if (isAuthenticated) {
    fetchCart();
  } else {
    // Guest cart is already in 'items' from localStorage if it existed
    setLoading(false);
  }
}, [isAuthenticated, user?.userType, location?.latitude, location?.longitude]);

// State for estimate delivery fee
const [estimatedFee, setEstimatedFee] = useState<number | undefined>(undefined);
const [platformFee, setPlatformFee] = useState<number | undefined>(undefined);
const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | undefined>(undefined);

const cart: Cart = useMemo(() => {
  // Filter out any items that are neither a product nor a combo offer
  const validItems = items.filter(item => item && (item.product || item.comboOffer));

  const total = validItems.reduce((sum, item) => {
    if (item.comboOffer) {
      return sum + (item.comboOffer.comboPrice || 0) * (item.quantity || 0);
    }
    if (item.product) {
      const { displayPrice } = calculateProductPrice(item.product, item.variant);
      return sum + displayPrice * (item.quantity || 0);
    }
    return sum;
  }, 0);

  const itemCount = validItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return {
    items: validItems,
    total,
    itemCount,
    estimatedDeliveryFee: estimatedFee,
    platformFee,
    freeDeliveryThreshold,
    debug_config: (items as any).debug_config,
    backendTotal: (items as any).backendTotal
  };
}, [items, estimatedFee, platformFee, freeDeliveryThreshold]);

const addToCart = async (product: Product, sourceElement?: HTMLElement | null) => {
  // Get consistent product ID - MongoDB returns _id, frontend expects id
  const productId = product._id || product.id;

  // Prevent concurrent operations on the same product
  if (pendingOperationsRef.current.has(productId)) {
    return;
  }
  pendingOperationsRef.current.add(productId);
  setIsOperating(true);

  // Normalize product to always have 'id' property for consistency
  const normalizedProduct: Product = {
    ...product,
    id: productId,
    name: product.name || product.productName || 'Product',
    imageUrl: product.imageUrl || product.mainImage,
  };

  // Optimistic Update
  // Get source position if element is provided
  let sourcePosition: { x: number; y: number } | undefined;
  if (sourceElement) {
    const rect = sourceElement.getBoundingClientRect();
    sourcePosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }
  setLastAddEvent({ product: normalizedProduct, sourcePosition });
  setTimeout(() => setLastAddEvent(null), 800);

  // Optimistically update state
  const previousItems = [...items];
  setItems((prevItems) => {
    // Filter out invalid items but preserve both products and combos
    const validItems = prevItems.filter(item => item && (item.product || item.comboOffer));

    // Check for variant ID or variant title if product has variations
    let variantId = (product as any).variantId || (product as any).selectedVariant?._id;
    let variantTitle = (product as any).variantTitle || (product as any).pack;

    // If no explicit variant info but variations exist, default to first variation
    if (!variantId && product.variations && product.variations.length > 0) {
      const firstVar = product.variations[0];
      variantId = (firstVar as any)._id || (firstVar as any).id;
      variantTitle = (firstVar as any).title || (firstVar as any).value || variantTitle;
    }

    // Find existing item - match by product ID and variant (if variant exists)
    const existingItem = validItems.find((item) => {
      if (!item.product) return false;
      const itemProductId = item.product.id || item.product._id;
      const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
      const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;

      // If both have variants, match by variant ID or title
      if (variantId || (itemVariantId && itemVariantId !== itemProductId)) {
        // Match by ID if both have it
        if (variantId && itemVariantId) {
          return itemProductId === productId && (itemVariantId === variantId || itemVariantTitle === variantTitle);
        }
        // Fallback to title
        return itemProductId === productId && itemVariantTitle === variantTitle;
      }
      // If no variant, match by product ID only
      return itemProductId === productId && !itemVariantId && !itemVariantTitle;
    });

    if (existingItem) {
      return validItems.map((item) => {
        if (!item.product) return item;
        const itemProductId = item.product.id || item.product._id;
        const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
        const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;

        // Match by product ID and variant
        const isMatch = (variantId || (itemVariantId && itemVariantId !== itemProductId))
          ? itemProductId === productId && (itemVariantId === variantId || itemVariantTitle === variantTitle)
          : itemProductId === productId && !itemVariantId && !itemVariantTitle;

        return isMatch
          ? { ...item, quantity: item.quantity + 1 }
          : item;
      });
    }
    return [...validItems, { id: `temp-${Date.now()}-${productId}`, product: normalizedProduct, quantity: 1 }];
  });

  // Only sync to API if user is authenticated
  if (isAuthenticated && user?.userType === 'Customer') {
    try {
      // Pass variation info to API if available
      // If product has variations but no variantId/selectedVariant is provided (e.g. from Home page),
      // use the ID of the first variation to ensure consistency with ProductDetail page
      let variation = (product as any).variantId || (product as any).selectedVariant?._id || (product as any).variantTitle;

      if (!variation && product.variations && product.variations.length > 0) {
        const firstVar = product.variations[0];
        variation = (firstVar as any)._id || (firstVar as any).id || (firstVar as any).title || (firstVar as any).value;
      }

      // Final fallback to pack
      if (!variation) {
        variation = product.pack;
      }

      const response = await apiAddToCart(
        productId,
        1,
        variation,
        location?.latitude,
        location?.longitude
      );
      if (response && response.data && response.data.items) {
        // Atomic update from server response
        setItems(mapApiItemsToState(response.data.items));
        setEstimatedFee(response.data.estimatedDeliveryFee);
        setPlatformFee(response.data.platformFee);
        setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
      }
    } catch (error: any) {
      console.error("Add to cart failed", error);
      // Show error toast
      showToast(error.response?.data?.message || "Failed to add to cart", 'error');
      // Revert on error
      setItems(previousItems);
    } finally {
      // Remove from pending operations
      pendingOperationsRef.current.delete(productId);
    }
  } else {
    // For unregistered users, the optimistic update is already saved to localStorage
    // Remove from pending operations immediately
    pendingOperationsRef.current.delete(productId);
  }
};

const addComboToCart = async (comboId: string, quantity: number = 1) => {
  if (!isAuthenticated || user?.userType !== 'Customer') {
    showToast("Please login to add combo offers to cart", 'error');
    return;
  }

  // Prevent concurrent operations
  if (pendingOperationsRef.current.has(comboId)) {
    return;
  }
  pendingOperationsRef.current.add(comboId);
  setIsOperating(true);

  // Optimistically update state
  const previousItems = [...items];
  setItems((prevItems) => {
    const existingItemIndex = prevItems.findIndex(item =>
      item.comboOffer && (item.comboOffer.id === comboId || item.comboOffer._id === comboId)
    );

    if (existingItemIndex > -1) {
      const newItems = [...prevItems];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity
      };
      return newItems;
    }

    // For new items, we don't have full combo info yet, 
    // but we can add a placeholder that will be replaced by the API response
    return [...prevItems, {
      id: `temp-combo-${Date.now()}-${comboId}`,
      comboOffer: { _id: comboId, id: comboId, name: 'Loading...', comboPrice: 0 },
      quantity
    } as any];
  });

  try {
    const response = await apiAddComboToCart(
      comboId,
      quantity,
      location?.latitude,
      location?.longitude
    );
    if (response && response.data && response.data.items) {
      setItems(mapApiItemsToState(response.data.items));
      setEstimatedFee(response.data.estimatedDeliveryFee);
      setPlatformFee(response.data.platformFee);
      setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
      showToast("Combo bundle added to cart!", 'success');
    }
  } catch (error: any) {
    console.error("Add combo to cart failed", error);
    showToast(error.response?.data?.message || "Failed to add combo to cart", 'error');
    setItems(previousItems);
  } finally {
    pendingOperationsRef.current.delete(comboId);
    setIsOperating(false);
  }
};

const removeFromCart = async (itemIdOrProductId: string) => {
  // Prevent concurrent operations
  if (pendingOperationsRef.current.has(itemIdOrProductId)) {
    return;
  }
  pendingOperationsRef.current.add(itemIdOrProductId);
  setIsOperating(true);

  // Find item matching product ID or CartItemID (_id/id)
  const itemToRemove = items.find(item =>
    item && (
      item.id === itemIdOrProductId ||
      (item as any)._id === itemIdOrProductId ||
      (item.product && (item.product.id === itemIdOrProductId || item.product._id === itemIdOrProductId)) ||
      (item.comboOffer && (item.comboOffer.id === itemIdOrProductId || item.comboOffer._id === itemIdOrProductId))
    )
  );

  const previousItems = [...items];
  setItems((prevItems) => {
    // Check if we have a specific ID match first (Cart Item ID)
    const hasSpecificMatch = prevItems.some(item =>
      item && (item.id === itemIdOrProductId || (item as any)._id === itemIdOrProductId)
    );

    if (hasSpecificMatch) {
      // Remove ONLY the specific item by its unique ID
      return prevItems.filter(item =>
        item && item.id !== itemIdOrProductId && (item as any)._id !== itemIdOrProductId
      );
    }

    // Fallback: Remove by Product ID or Combo ID (broad removal)
    return prevItems.filter((item) => {
      if (!item) return false;
      return (!item.product || (item.product.id !== itemIdOrProductId && item.product._id !== itemIdOrProductId)) &&
        (!item.comboOffer || (item.comboOffer.id !== itemIdOrProductId && item.comboOffer._id !== itemIdOrProductId));
    });
  });

  // Only sync to API if user is authenticated and item has a valid persistent ID (not temp)
  const isTempId = itemIdOrProductId.startsWith('temp-');
  if (isAuthenticated && user?.userType === 'Customer' && itemToRemove?.id && !isTempId) {
    try {
      const response = await apiRemoveFromCart(
        itemToRemove.id,
        location?.latitude,
        location?.longitude
      );
      if (response && response.data && response.data.items) {
        setItems(mapApiItemsToState(response.data.items));
        setEstimatedFee(response.data.estimatedDeliveryFee);
        setPlatformFee(response.data.platformFee);
        setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
      }
    } catch (error) {
      console.error("Remove from cart failed", error);
      setItems(previousItems);
    } finally {
      // Remove from pending operations
      pendingOperationsRef.current.delete(itemIdOrProductId);
      setIsOperating(false);
    }
  } else {
    // For unregistered users or temp IDs, remove from pending operations immediately
    pendingOperationsRef.current.delete(itemIdOrProductId);
    setIsOperating(false);
  }
};

const updateQuantity = async (itemIdOrProductId: string, quantity: number, variantId?: string, variantTitle?: string) => {
  if (quantity <= 0) {
    removeFromCart(itemIdOrProductId);
    return;
  }

  // Create a unique operation key
  const operationKey = variantId ? `${itemIdOrProductId}-${variantId}` : (variantTitle ? `${itemIdOrProductId}-${variantTitle}` : itemIdOrProductId);

  // Prevent concurrent operations
  if (pendingOperationsRef.current.has(operationKey)) {
    return;
  }
  pendingOperationsRef.current.add(operationKey);
  setIsOperating(true);

  // Find item matching ID, product ID + variant, or combo ID
  const itemToUpdate = items.find(item => {
    if (!item) return false;

    // Match by Cart Item ID (strongest match)
    if (item.id === itemIdOrProductId || (item as any)._id === itemIdOrProductId) return true;

    // Match by Product ID + Variant
    if (item.product) {
      const itemProductId = item.product.id || item.product._id;
      if (itemProductId === itemIdOrProductId) {
        // If variant info provided, match by variant
        if (variantId || variantTitle) {
          const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
          const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;
          return itemVariantId === variantId || itemVariantTitle === variantTitle;
        }
        // If no variant info, match items without variants
        const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
        const itemVariantTitle = (item.product as any).variantTitle;
        return !itemVariantId && !itemVariantTitle;
      }
    }

    // Match by Combo ID
    if (item.comboOffer) {
      const comboId = item.comboOffer.id || item.comboOffer._id;
      return comboId === itemIdOrProductId;
    }

    return false;
  });

  const previousItems = [...items];
  setItems((prevItems) =>
    prevItems.filter(item => item && (item.product || item.comboOffer)).map((item) => {
      // Match logic same as above for consistency
      let isMatch = false;
      if (item.id === itemIdOrProductId || (item as any)._id === itemIdOrProductId) {
        isMatch = true;
      } else if (item.product && (item.product.id === itemIdOrProductId || item.product._id === itemIdOrProductId)) {
        if (variantId || variantTitle) {
          const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
          const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;
          isMatch = itemVariantId === variantId || itemVariantTitle === variantTitle;
        } else {
          const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
          const itemVariantTitle = (item.product as any).variantTitle;
          isMatch = !itemVariantId && !itemVariantTitle;
        }
      } else if (item.comboOffer) {
        const comboId = item.comboOffer.id || item.comboOffer._id;
        isMatch = comboId === itemIdOrProductId;
      }

      return isMatch ? { ...item, quantity } : item;
    })
  );

  // Only sync to API if user is authenticated and item has CartItemID
  if (isAuthenticated && user?.userType === 'Customer' && itemToUpdate?.id) {
    try {
      const response = await apiUpdateCartItem(
        itemToUpdate.id,
        quantity,
        location?.latitude,
        location?.longitude
      );
      if (response && response.data && response.data.items) {
        setItems(mapApiItemsToState(response.data.items));
        setEstimatedFee(response.data.estimatedDeliveryFee);
        setPlatformFee(response.data.platformFee);
        setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
      }
    } catch (error) {
      console.error("Update quantity failed", error);
      setItems(previousItems);
    } finally {
      // Remove from pending operations
      pendingOperationsRef.current.delete(operationKey);
      setIsOperating(false);
    }
  } else {
    // For unregistered users, remove from pending operations immediately
    pendingOperationsRef.current.delete(operationKey);
    setIsOperating(false);
  }
};
const clearCart = async () => {
  setIsOperating(true);
  setItems([]);
  try {
    await apiClearCart();
  } catch (error) {
    console.error("Clear cart failed", error);
    await fetchCart();
  } finally {
    setIsOperating(false);
  }
};

const refreshCart = async (latitude?: number, longitude?: number) => {
  await fetchCart(latitude, longitude);
};

return (
  <CartContext.Provider
    value={{ cart, addToCart, addComboToCart, removeFromCart, updateQuantity, clearCart, refreshCart, lastAddEvent, loading, isOperating }}
  >
    {children}
  </CartContext.Provider>
);
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}


