import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Delivery from "../../../models/Delivery";
import Order from "../../../models/Order";
import EquipmentOrder from "../../../models/EquipmentOrder";
import mongoose from "mongoose";

/**
 * Get Dashboard Stats
 * Returns: Daily Collection, Cash Balance, Pending Orders, All Orders, etc.
 */
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    // Assuming user ID is attached to req.user by auth middleware
    const deliveryId = req.user?.userId;

    if (!deliveryId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Fetch Delivery Partner Details (for Cash Balance)
    const deliveryPartner = await Delivery.findById(deliveryId);
    if (!deliveryPartner) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery partner not found" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2. Fetch Orders Combined Stats
    const objectId = new mongoose.Types.ObjectId(deliveryId);

    const [orderStats, equipmentStats] = await Promise.all([
      Order.aggregate([
        { $match: { deliveryBoy: objectId } },
        {
          $group: {
            _id: null,
            pendingOrders: {
              $sum: {
                $cond: [{ $in: ["$status", ["Ready for pickup", "Out for Delivery", "Picked Up", "Assigned", "In Transit"]] }, 1, 0],
              },
            },
            allOrdersToday: {
              $sum: {
                $cond: [{ $and: [{ $gte: ["$updatedAt", todayStart] }, { $lte: ["$updatedAt", todayEnd] }] }, 1, 0],
              },
            },
            returnOrdersToday: {
              $sum: {
                $cond: [{ $and: [{ $in: ["$status", ["Returned", "Cancelled"]] }, { $gte: ["$updatedAt", todayStart] }, { $lte: ["$updatedAt", todayEnd] }] }, 1, 0],
              },
            },
            dailyCollection: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$status", "Delivered"] }, { $eq: ["$paymentMethod", "COD"] }, { $gte: ["$deliveredAt", todayStart] }, { $lte: ["$deliveredAt", todayEnd] }] }, "$total", 0],
              },
            },
            todayDeliveredCount: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$status", "Delivered"] }, { $gte: ["$deliveredAt", todayStart] }, { $lte: ["$deliveredAt", todayEnd] }] }, 1, 0],
              },
            },
            totalDeliveredCount: {
              $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
            },
          },
        },
      ]),
      EquipmentOrder.aggregate([
        { $match: { deliveryBoy: objectId } },
        {
          $group: {
            _id: null,
            pendingOrders: {
              $sum: {
                $cond: [{ $in: ["$status", ["assigned", "picked_up"]] }, 1, 0],
              },
            },
            allOrdersToday: {
              $sum: {
                $cond: [{ $and: [{ $gte: ["$updatedAt", todayStart] }, { $lte: ["$updatedAt", todayEnd] }] }, 1, 0],
              },
            },
            returnOrdersToday: {
              $sum: {
                $cond: [{ $and: [{ $in: ["$status", ["cancelled", "rejected"]] }, { $gte: ["$updatedAt", todayStart] }, { $lte: ["$updatedAt", todayEnd] }] }, 1, 0],
              },
            },
            dailyCollection: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$status", "delivered"] }, { $eq: ["$paymentMethod", "COD"] }, { $gte: ["$updatedAt", todayStart] }, { $lte: ["$updatedAt", todayEnd] }] }, "$total", 0],
              },
            },
            todayDeliveredCount: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$status", "delivered"] }, { $gte: ["$updatedAt", todayStart] }, { $lte: ["$updatedAt", todayEnd] }] }, 1, 0],
              },
            },
            totalDeliveredCount: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
          },
        },
      ])
    ]);

    const s1 = orderStats[0] || { pendingOrders: 0, allOrdersToday: 0, returnOrdersToday: 0, dailyCollection: 0, todayDeliveredCount: 0, totalDeliveredCount: 0 };
    const s2 = equipmentStats[0] || { pendingOrders: 0, allOrdersToday: 0, returnOrdersToday: 0, dailyCollection: 0, todayDeliveredCount: 0, totalDeliveredCount: 0 };

    const result = {
      pendingOrders: s1.pendingOrders + s2.pendingOrders,
      allOrdersToday: s1.allOrdersToday + s2.allOrdersToday,
      returnOrdersToday: s1.returnOrdersToday + s2.returnOrdersToday,
      dailyCollection: s1.dailyCollection + s2.dailyCollection,
      todayDeliveredCount: s1.todayDeliveredCount + s2.todayDeliveredCount,
      totalDeliveredCount: s1.totalDeliveredCount + s2.totalDeliveredCount,
    };

    // Calculate Earnings (Real Logic from Commission Collection)
    const { default: Commission } = await import("../../../models/Commission");

    const earningStats = await Commission.aggregate([
      {
        $match: {
          deliveryBoy: objectId,
          type: "DELIVERY_BOY",
        },
      },
      {
        $facet: {
          today: [
            {
              $match: {
                createdAt: { $gte: todayStart, $lte: todayEnd },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$commissionAmount" },
              },
            },
          ],
          total: [
            {
              $group: {
                _id: null,
                total: { $sum: "$commissionAmount" },
              },
            },
          ],
        },
      },
    ]);

    const todayEarning = earningStats[0]?.today[0]?.total || 0;
    const totalEarning = earningStats[0]?.total[0]?.total || 0;

    // Fetch list of Pending Orders from both models
    const [ordersList, eqOrdersList] = await Promise.all([
      Order.find({
        deliveryBoy: deliveryId,
        status: { $in: ["Ready for pickup", "Out for Delivery", "Picked Up", "Assigned", "In Transit"] },
      })
      .select("orderNumber customerName deliveryAddress status total estimatedDeliveryDate")
      .sort({ createdAt: -1 })
      .limit(5),
      
      EquipmentOrder.find({
        deliveryBoy: deliveryId,
        status: { $in: ["assigned", "picked_up"] },
      })
      .select("orderNumber sellerName deliveryAddress sellerAddress status total")
      .sort({ createdAt: -1 })
      .limit(5)
    ]);

    // Format and combine pending list for Frontend
    const formattedPendingList = [
      ...ordersList.map((order: any) => ({
        id: order._id,
        orderId: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        address: `${order.deliveryAddress?.address || ""}, ${order.deliveryAddress?.city || ""}`,
        totalAmount: order.total,
        orderType: 'ORDER',
        estimatedDeliveryTime: order.estimatedDeliveryDate
          ? new Date(order.estimatedDeliveryDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "N/A",
      })),
      ...eqOrdersList.map((order: any) => ({
        id: order._id,
        orderId: order.orderNumber,
        customerName: order.sellerName,
        status: order.status,
        address: order.deliveryAddress?.address || order.sellerAddress || 'N/A',
        totalAmount: order.total,
        orderType: 'EQUIPMENT',
        estimatedDeliveryTime: "N/A",
      }))
    ].sort((a, b) => (b as any).createdAt - (a as any).createdAt).slice(0, 5);

    // Fetch Wallet Balance
    let walletBalance = 0;
    try {
      const {
        getWalletBalance,
      } = require("../../../services/walletManagementService");
      walletBalance = await getWalletBalance(deliveryId, "DELIVERY_BOY");
    } catch (error) {
      console.error("Error fetching wallet balance for dashboard:", error);
    }

    return res.status(200).json({
      success: true,
      data: {
        dailyCollection: result.dailyCollection,
        cashBalance: deliveryPartner.cashCollected, // This field stores total cash holding
        pendingOrders: result.pendingOrders,
        allOrders: result.allOrdersToday,
        returnOrders: result.returnOrdersToday,
        returnItems: 0, // Need 'OrderItem' logic for this, keeping 0 for now
        todayEarning: todayEarning,
        totalEarning: totalEarning,
        walletBalance: walletBalance,
        todayDeliveredCount: result.todayDeliveredCount,
        totalDeliveredCount: result.totalDeliveredCount,
        pendingOrdersList: formattedPendingList,
      },
    });
  },
);

/**
 * Get Help & Support Data
 */
export const getHelpSupport = asyncHandler(
  async (_req: Request, res: Response) => {
    const faqItems = [
      {
        question: "How do I accept a new order?",
        answer:
          'When you receive a new order notification, tap on it to view order details. Click "Accept Order" to confirm.',
      },
      {
        question: "What should I do if I cannot deliver an order?",
        answer:
          'Contact the customer first. If unable to reach them, mark the order as "Unable to Deliver" and contact support.',
      },
      {
        question: "How are my earnings calculated?",
        answer:
          "You earn ₹25 per successful delivery. Additional bonuses may apply for special orders or peak hours.",
      },
      {
        question: "How do I update my profile information?",
        answer:
          'Go to Menu > Profile and tap "Edit Profile" to update your personal details, vehicle information, etc.',
      },
      {
        question: "What if I have a complaint or issue?",
        answer:
          "You can contact our support team through the Help & Support section or call our helpline at +91 7846940429.",
      },
      {
        question: "What are the delivery timings?",
        answer:
          "You can deliver orders between 8 AM and 10 PM. Peak hours are usually during lunch (12-3 PM) and dinner (7-10 PM).",
      },
    ];

    const contactOptions = [
      { label: "Call Support", value: "+91 7846940429", icon: "phone" },
      {
        label: "Email Support",
        value: "support@dhakadsnazzy.com",
        icon: "email",
      },
      { label: "Live Chat", value: "Available 24/7", icon: "chat" },
    ];

    res.status(200).json({
      success: true,
      data: {
        faqs: faqItems,
        contact: contactOptions,
      },
    });
  },
);
