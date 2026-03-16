import Order from "../models/Order";
import { IOrderItem } from "../models/OrderItem";
import Inventory from "../models/Inventory";
import AppSettings from "../models/AppSettings";
import Customer from "../models/Customer";
import { clearOrderCache } from "../socket/socketService";
import { creditWallet } from "./walletManagementService";

/**
 * Process order status transition
 */
export const processOrderStatusTransition = async (
  orderId: string,
  newStatus: string,
  previousStatus: string
) => {
  const order = await Order.findById(orderId).populate("items");

  if (!order) {
    throw new Error("Order not found");
  }

  // Clear tracking cache if order is completed, cancelled, or rejected
  if (["Delivered", "Cancelled", "Returned", "Failed", "Rejected"].includes(newStatus)) {
    clearOrderCache(orderId);
  }

  // Handle status-specific logic
  switch (newStatus) {
    case "Cancelled":
      // Restore inventory if order was confirmed
      if (["Processed", "Shipped"].includes(previousStatus)) {
        await restoreInventory(order.items as any[]);
      }
      break;

    case "Processed":
      // Reserve inventory
      await reserveInventory(order.items as any[]);
      break;

    case "Delivered":
      // Create commissions for sellers
      await createCommissions(order.items as any[]);
      // Process referral rewards
      await processReferralReward(orderId);
      break;
  }

  return order;
};

/**
 * Reserve inventory for order items
 */
const reserveInventory = async (items: IOrderItem[]) => {
  for (const item of items) {
    const inventory = await Inventory.findOne({ product: item.product });
    if (inventory) {
      inventory.reservedStock += item.quantity;
      inventory.availableStock = Math.max(
        0,
        inventory.currentStock - inventory.reservedStock
      );
      await inventory.save();
    }
  }
};

/**
 * Restore inventory when order is cancelled
 */
const restoreInventory = async (items: IOrderItem[]) => {
  for (const item of items) {
    const inventory = await Inventory.findOne({ product: item.product });
    if (inventory) {
      inventory.reservedStock = Math.max(
        0,
        inventory.reservedStock - item.quantity
      );
      inventory.availableStock =
        inventory.currentStock - inventory.reservedStock;
      await inventory.save();
    }
  }
};

/**
 * Create commissions for sellers when order is delivered
 * Also updates seller balances and creates wallet transactions
 */
/**
 * Create commissions for sellers when order is delivered
 * Now delegating to commissionService.distributeCommissions
 */
const createCommissions = async (items: IOrderItem[]) => {
  if (!items || items.length === 0) return;

  try {
    const orderId = items[0].order.toString();
    const order = await Order.findById(orderId);

    if (!order) return;

    if (order.paymentMethod && order.paymentMethod.toUpperCase() === "COD") {
      // For COD orders, use the comprehensive COD processing logic
      const { processCODOrderDelivery } = await import("./commissionService");
      await processCODOrderDelivery(orderId);
    } else {
      // For online/prepaid orders, distribute commissions immediately
      const { distributeCommissions } = await import("./commissionService");
      await distributeCommissions(orderId);
    }
  } catch (err) {
    console.error("Error creating commissions in orderService:", err);
    throw err;
  }
};

/**
 * Process referral rewards when an order is delivered
 */
const processReferralReward = async (orderId: string) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    const customer = await Customer.findById(order.customer);
    if (!customer || !customer.referredBy || customer.totalOrders > 1) {
      // Reward only for the first order
      return;
    }

    const settings = await AppSettings.findOne();
    const referralSettings = settings?.referralSettings;

    if (!referralSettings || !referralSettings.enabled) {
      return;
    }

    // Check minimum order value
    if (order.total < (referralSettings.minOrderValue || 0)) {
      console.log(`[Referral] Order total ${order.total} is less than min order value ${referralSettings.minOrderValue}`);
      return;
    }

    const referrer = await Customer.findById(customer.referredBy);
    if (!referrer) return;

    // Check max referrals limit for referrer
    const maxReferrals = referralSettings.maxReferralsPerUser || 10;
    if ((referrer.referralCount || 0) >= maxReferrals) {
      console.log(`[Referral] Referrer ${referrer.refCode} has reached max referrals limit`);
      return;
    }

    const rewardAmount = referralSettings.rewardAmount || 0;
    if (rewardAmount <= 0) return;

    console.log(`[Referral] Crediting referral rewards: Referrer=${referrer.refCode}, NewUser=${customer.refCode}, Amount=${rewardAmount}`);

    // Credit Referrer
    await creditWallet(
      referrer._id.toString(),
      "CUSTOMER",
      rewardAmount,
      `Referral bonus for inviting ${customer.name}`,
      orderId
    );

    // Update referrer stats
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.referralEarnings = (referrer.referralEarnings || 0) + rewardAmount;
    await referrer.save();

    // Credit New User (Referee)
    await creditWallet(
      customer._id.toString(),
      "CUSTOMER",
      rewardAmount,
      `Referral bonus for joining using ${referrer.refCode}'s code`,
      orderId
    );

  } catch (error) {
    console.error("Error processing referral reward:", error);
  }
};


/**
 * Validate order can transition to new status
 */
export const validateStatusTransition = (
  currentStatus: string,
  newStatus: string
): { valid: boolean; message?: string } => {
  const validTransitions: Record<string, string[]> = {
    Received: ["Pending", "Cancelled", "Rejected"],
    Pending: ["Processed", "Cancelled", "Rejected"],
    Processed: ["Shipped", "Cancelled", "Rejected"],
    Shipped: ["Out for Delivery", "Cancelled", "Rejected"],
    "Out for Delivery": ["Delivered", "Cancelled", "Rejected"],
    Delivered: ["Returned"],
    Cancelled: [],
    Rejected: [],
    Returned: [],
  };

  const allowedStatuses = validTransitions[currentStatus] || [];

  if (!allowedStatuses.includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${allowedStatuses.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
};

/**
 * Calculate order totals
 */
export const calculateOrderTotals = async (
  items: IOrderItem[],
  couponCode?: string
) => {
  let subtotal = 0;
  let tax = 0;
  let shipping = 0;
  let discount = 0;

  // Calculate subtotal from items
  for (const item of items) {
    subtotal += item.total;
  }

  // Apply coupon discount if provided
  if (couponCode) {
    // Coupon validation and discount calculation would go here
    // For now, we'll skip this as it's handled in the coupon controller
  }

  // Calculate tax (example: 18% GST)
  tax = subtotal * 0.18;

  // Calculate shipping (example: free shipping over 500)
  if (subtotal < 500) {
    shipping = 50;
  }

  const total = subtotal + tax + shipping - discount;

  return {
    subtotal,
    tax,
    shipping,
    discount,
    total,
  };
};
