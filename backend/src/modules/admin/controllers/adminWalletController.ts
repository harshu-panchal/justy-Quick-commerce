import { Request, Response } from "express";
import mongoose from "mongoose";
import Commission from "../../../models/Commission";
import WalletTransaction from "../../../models/WalletTransaction";
import WithdrawRequest from "../../../models/WithdrawRequest";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
} from "./adminWithdrawalController";
import Executive from "../../../models/Executive";
import ExecutiveWithdrawal from "../../../models/ExecutiveWithdrawal";
import ExecutiveWalletTransaction from "../../../models/ExecutiveWalletTransaction";

/**
 * Get Financial Dashboard Stats
 */
/**
 * Get Financial Dashboard Stats
 */
export const getFinancialDashboard = asyncHandler(
  async (_req: Request, res: Response) => {
    // Import PlatformWallet
    const PlatformWallet = (await import("../../../models/PlatformWallet")).default;

    // Get Platform Wallet data
    const platformWallet = await PlatformWallet.findOne();

    // 1. Calculate Real-time Seller Pending Payouts -> Sum of all Seller Balances
    const sellerBalanceResult = await mongoose.model("Seller").aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]);
    const realTimeSellerPending = sellerBalanceResult.length > 0 ? sellerBalanceResult[0].total : 0;

    // 2. Calculate Real-time Delivery Boy Pending Payouts & Debt
    const deliveryBalanceResult = await mongoose.model("Delivery").aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalPendingDebt: { $sum: "$pendingAdminPayout" },
        },
      },
    ]);
    const realTimeDeliveryPendingPayouts = deliveryBalanceResult.length > 0 ? deliveryBalanceResult[0].totalBalance : 0;
    const realTimePendingFromDeliveryBoy = deliveryBalanceResult.length > 0 ? deliveryBalanceResult[0].totalPendingDebt : 0;
    
    // 3. Calculate Real-time Executive Pending Payouts
    const executiveBalanceResult = await Executive.aggregate([
      { $group: { _id: null, total: { $sum: "$walletBalance" } } },
    ]);
    const realTimeExecutivePending = executiveBalanceResult.length > 0 ? executiveBalanceResult[0].total : 0;

    if (platformWallet) {
      // Use platform wallet for overall earnings but real-time aggregates for payouts
      return res.status(200).json({
        success: true,
        data: {
          // Platform Wallet Data (Earnings & Balance)
          totalPlatformEarning: platformWallet.totalPlatformEarning,
          currentPlatformBalance: platformWallet.currentPlatformBalance,
          totalAdminEarning: Math.round(platformWallet.totalAdminEarning * 100) / 100,

          // Real-time aggregates of balances (Liabilities)
          pendingFromDeliveryBoy: realTimePendingFromDeliveryBoy,
          sellerPendingPayouts: realTimeSellerPending,
          deliveryBoyPendingPayouts: realTimeDeliveryPendingPayouts,
          executivePendingPayouts: realTimeExecutivePending,

          // Legacy fields for backward compatibility
          totalGMV: platformWallet.totalPlatformEarning,
          totalAdminEarnings: Math.round(platformWallet.totalAdminEarning * 100) / 100,
          currentAccountBalance: platformWallet.currentPlatformBalance,
          pendingAmountFromDeliveryBoy: realTimePendingFromDeliveryBoy,

          // Additional stats
          pendingWithdrawalsCount: await WithdrawRequest.countDocuments({
            status: "Pending",
          }) + await ExecutiveWithdrawal.countDocuments({ status: "Pending" }),
        },
      });
    }

    // Fallback: Calculate from scratch if platform wallet doesn't exist yet
    // (This handles the case before any COD orders have been processed)

    // 1. Total Platform Earnings (Net GMV)
    // Formula: Sum(Order.total) - Sum(Delivery Commissions)
    // This represents the total money that flows into the platform (Admin + Sellers)
    const totalOrderAmountResult = await mongoose
      .model("Order")
      .aggregate([
        { $match: { status: { $ne: "Cancelled" }, paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);
    const totalOrderAmount =
      totalOrderAmountResult.length > 0 ? totalOrderAmountResult[0].total : 0;

    // All delivery commissions (to be subtracted from gross GMV for net platform earnings)
    // For COD orders, the user requested not to reduce anything from platform earning and balance
    const allDeliveryCommResult = await Commission.aggregate([
      { $match: { type: "DELIVERY_BOY", status: { $ne: "Cancelled" } } },
      {
        $lookup: {
          from: "orders",
          localField: "order",
          foreignField: "_id",
          as: "orderData",
        },
      },
      { $unwind: "$orderData" },
      { $match: { "orderData.paymentMethod": { $ne: "COD" } } },
      { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
    ]);
    const allDeliveryCommissions =
      allDeliveryCommResult.length > 0 ? allDeliveryCommResult[0].total : 0;

    const totalGMV = totalOrderAmount - allDeliveryCommissions;

    // 2. Total Admin Earnings
    // Formula: SellerCommissions + OrderFees (Platform+Shipping) - DeliveryCommissions

    // A. Seller Commissions (The 10% part)
    const sellerCommResult = await Commission.aggregate([
      { $match: { type: "SELLER", status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
    ]);
    const sellerCommissions =
      sellerCommResult.length > 0 ? sellerCommResult[0].total : 0;

    // B. Delivery Commissions (The part paid to delivery boy)
    // For COD orders, the user requested not to subtract delivery commissions from admin earnings
    const deliveryCommResult = await Commission.aggregate([
      { $match: { type: "DELIVERY_BOY", status: { $ne: "Cancelled" } } },
      {
        $lookup: {
          from: "orders",
          localField: "order",
          foreignField: "_id",
          as: "orderData",
        },
      },
      { $unwind: "$orderData" },
      { $match: { "orderData.paymentMethod": { $ne: "COD" } } },
      { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
    ]);
    const deliveryCommissions =
      deliveryCommResult.length > 0 ? deliveryCommResult[0].total : 0;

    // C. Order Fees (Platform Fee + Shipping Charge)
    const orderFeesResult = await mongoose.model("Order").aggregate([
      { $match: { status: { $ne: "Cancelled" }, paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $add: ["$platformFee", "$shipping"] } },
        },
      },
    ]);
    const orderFees = orderFeesResult.length > 0 ? orderFeesResult[0].total : 0;

    // Calculation: (SellerComm + PlatformFee + Shipping) - DeliveryComm
    // This effectively gives: SellerComm + PlatformFee + (Shipping - DeliveryComm) -> where (Shipping-DeliveryComm) is Base Charge
    const totalAdminEarnings =
      sellerCommissions + orderFees - deliveryCommissions;

    // Calculate Total Completed Withdrawals (Outflow)
    const withdrawalResult = await WithdrawRequest.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalWithdrawals =
      withdrawalResult.length > 0 ? withdrawalResult[0].total : 0;

    // Current Platform Balance = Total Inflow (GMV) - Total Outflow (Withdrawals)
    const currentAccountBalance = totalGMV - totalWithdrawals;

    // 3. Reuse calculated Real-time Seller Pending Payouts
    const sellerPendingPayouts = realTimeSellerPending;

    // 4. Reuse calculated Real-time Delivery Boy Pending Payouts
    const deliveryPendingPayouts = realTimeDeliveryPendingPayouts;
    const pendingAmountFromDeliveryBoy = realTimePendingFromDeliveryBoy;

    return res.status(200).json({
      success: true,
      data: {
        totalGMV,
        totalAdminEarnings,
        totalWithdrawals,
        currentAccountBalance,
        sellerPendingPayouts,
        deliveryPendingPayouts,
        pendingAmountFromDeliveryBoy,
        executivePendingPayouts: realTimeExecutivePending,
        // Legacy field just in case
        pendingWithdrawalsCount: await WithdrawRequest.countDocuments({
          status: "Pending",
        }) + await ExecutiveWithdrawal.countDocuments({ status: "Pending" }),
      },
    });
  },
);

/**
 * Get Admin Earnings (Commissions List)
 */
export const getAdminEarnings = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const earnings = await Commission.find(query)
      .populate("order", "orderNumber")
      .populate("seller", "storeName sellerName")
      .populate("deliveryBoy", "name mobile")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Commission.countDocuments(query);

    // Format data for frontend
    const formattedEarnings = earnings.map((e) => {
      let sourceName = "Unknown";
      if (e.type === "SELLER" && e.seller) {
        sourceName =
          (e.seller as any).storeName || (e.seller as any).sellerName;
      } else if (e.type === "DELIVERY_BOY" && e.deliveryBoy) {
        sourceName = (e.deliveryBoy as any).name;
      }

      return {
        id: e._id,
        source: sourceName,
        sourceType: e.type,
        amount: e.commissionAmount,
        date: e.createdAt,
        status: e.status,
        description: `Order #${(e.order as any)?.orderNumber || "Unknown"}`,
        orderId: (e.order as any)?._id,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedEarnings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

/**
 * Get All Wallet Transactions (Sellers & Delivery Boys)
 */
export const getWalletTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, type, userType, search: _search } = req.query;

    const query: any = {};
    if (type) query.type = type;
    if (userType) query.userType = userType;

    // Search handling not fully implemented for cross-collection ref

    const skip = (Number(page) - 1) * Number(limit);

    let transactions: any[] = [];
    let total = 0;

    // Build specific filters for different models
    const walletFilter: any = { ...query };
    const executiveFilter: any = {};
    if (type) executiveFilter.type = type;

    if (userType === 'EXECUTIVE') {
      transactions = await ExecutiveWalletTransaction.find(executiveFilter)
        .populate({
          path: "executive",
          select: "name mobile email",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      total = await ExecutiveWalletTransaction.countDocuments(executiveFilter);
      
      // Normalize executive transactions to match WalletTransaction format
      transactions = transactions.map(t => ({
        ...t.toObject(),
        userId: t.executive,
        userType: 'EXECUTIVE',
        relatedOrder: t.referenceId && t.source === 'Commission' ? { orderNumber: 'Referral' } : undefined
      }));
    } else if (userType && userType !== 'EXECUTIVE') {
      transactions = await WalletTransaction.find(walletFilter)
        .populate({
          path: "userId",
          select: "name firstName lastName storeName sellerName mobile email",
        })
        .populate("relatedOrder", "orderNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
      
      total = await WalletTransaction.countDocuments(walletFilter);
    } else {
      // Fetch from both and merge if no specific userType filter is applied
      // Note: WalletTransaction might contain some 'EXECUTIVE' records if created there
      const [walletTrx, executiveTrx] = await Promise.all([
        WalletTransaction.find(walletFilter)
          .populate({
            path: "userId",
            select: "name firstName lastName storeName sellerName mobile email",
          })
          .populate("relatedOrder", "orderNumber")
          .sort({ createdAt: -1 })
          .limit(Number(limit) + skip),
        ExecutiveWalletTransaction.find(executiveFilter)
          .populate({
            path: "executive",
            select: "name mobile email",
          })
          .sort({ createdAt: -1 })
          .limit(Number(limit) + skip)
      ]);

      const normalizedExecutiveTrx = executiveTrx.map(t => ({
        ...t.toObject(),
        userId: t.executive,
        userType: 'EXECUTIVE',
        relatedOrder: t.referenceId && t.source === 'Commission' ? { orderNumber: 'Referral' } : undefined
      }));

      const allTrx = [...walletTrx, ...normalizedExecutiveTrx].sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      transactions = allTrx.slice(skip, skip + Number(limit));
      total = await WalletTransaction.countDocuments(walletFilter) + await ExecutiveWalletTransaction.countDocuments(executiveFilter);
    }

    // Format transactions to ensure user name is accessible
    const formattedTransactions = transactions.map((t: any) => {
      let userName = "Unknown User";
      
      // Handle both normalized (t.userId) and raw (t.executive) formats
      // and check if they are actually populated (not just an ID)
      const userData = t.userId || t.executive;
      const isPopulated = userData && 
                         typeof userData === 'object' && 
                         !mongoose.Types.ObjectId.isValid(userData.toString()) &&
                         (userData.name || userData.storeName || userData.sellerName || userData.firstName);

      if (isPopulated) {
        if (t.userType === "SELLER") {
          userName = userData.storeName || userData.sellerName || "Unnamed Seller";
        } else if (t.userType === "EXECUTIVE") {
          userName = userData.name || "Unnamed Executive";
        } else {
          userName = userData.name || 
                     (userData.firstName ? `${userData.firstName} ${userData.lastName || ""}`.trim() : "Unnamed Delivery Partner");
        }
      } else if (userData) {
        // Fallback for ID-only data
        userName = `User (${userData.toString().substring(0, 8)}...)`;
      }

      return {
        _id: t._id,
        type: t.type,
        userType: t.userType || 'Unknown',
        userName: userName,
        userId: isPopulated ? (userData._id || userData.id) : userData,
        amount: t.amount || 0,
        description: t.description || "No description",
        status: t.status || "Completed",
        createdAt: t.createdAt,
        reference: t.reference,
        relatedOrder: t.relatedOrder && typeof t.relatedOrder === 'object' && 'orderNumber' in t.relatedOrder
          ? { orderNumber: (t.relatedOrder as any).orderNumber }
          : undefined,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

/**
 * Get Specific Seller Wallet Transactions
 */
export const getSellerTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await WalletTransaction.find({
      userId: id,
      userType: "SELLER",
    })
      .populate("relatedOrder", "orderNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await WalletTransaction.countDocuments({
      userId: id,
      userType: "SELLER",
    });

    // Format for AdminSellerTransaction.tsx expectations
    const formattedTransactions = transactions.map((t: any) => ({
      id: t._id,
      amount: t.amount,
      transactionType: t.type.toLowerCase(), // 'credit' or 'debit'
      date: t.createdAt,
      type: t.description,
      status: t.status,
      description: t.description,
      orderId: t.relatedOrder?.orderNumber,
    }));

    return res.status(200).json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  },
);

/**
 * Process Withdrawal Wrapper (to match frontend service expectation)
 */
export const processWithdrawalWrapper = asyncHandler(
  async (req: Request, res: Response, next: any) => {
    const { requestId, action, remark, transactionReference, userType } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({
        success: false,
        message: "Request ID and action are required",
      });
    }

    // Determine if this is an executive withdrawal
    let isExecutive = userType === 'EXECUTIVE';
    
    if (!userType) {
      const exists = await ExecutiveWithdrawal.exists({ _id: requestId });
      if (exists) isExecutive = true;
    }

    if (isExecutive) {
      const { processWithdrawal: processExecWithdrawal } = await import("./adminExecutiveController");
      
      // Map wallet actions to executive statuses
      let execStatus = '';
      if (action === 'Approve') execStatus = 'Approved';
      else if (action === 'Reject') execStatus = 'Rejected';
      else if (action === 'Complete') execStatus = 'Paid';

      req.params.id = requestId;
      req.body.status = execStatus;
      req.body.adminNote = remark;
      req.body.transactionId = transactionReference;
      
      return processExecWithdrawal(req, res, next);
    }

    // Standard withdrawal processing (Sellers/Delivery Boys)
    req.params.id = requestId;

    if (action === "Approve") {
      return approveWithdrawal(req, res);
    } else if (action === "Reject") {
      req.body.remarks = remark; // Map 'remark' to 'remarks'
      return rejectWithdrawal(req, res);
    } else if (action === "Complete") {
      if (!transactionReference) {
        return res.status(400).json({
          success: false,
          message: "Transaction reference is required for completion",
        });
      }
      req.body.transactionReference = transactionReference;
      return completeWithdrawal(req, res);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "Approve", "Reject", or "Complete"',
      });
    }
  },
);
