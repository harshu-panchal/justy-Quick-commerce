import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Seller from "../../../models/Seller";
import SellerWalletTransaction from "../../../models/SellerWalletTransaction";
import mongoose from "mongoose";

/**
 * Get all sellers (for dropdowns/lists)
 */
export const getAllSellers = asyncHandler(async (_req: Request, res: Response) => {
    // Select essential fields plus fallbacks
    const sellers = await Seller.find({})
        .select("sellerName storeName profile status balance securityDeposit depositAmount email mobile")
        .sort({ storeName: 1 });

    const processedSellers = sellers.map(seller => {
        const s = seller.toObject();
        
        // Robust fallback for securityDeposit - check for undefined/null instead of falsy 0
        let securityDeposit = 1000;
        if (typeof s.securityDeposit === 'number') {
            securityDeposit = s.securityDeposit;
        } else if (typeof s.depositAmount === 'number') {
            securityDeposit = s.depositAmount;
        }

        return {
            ...s,
            email: s.email || s.mobile || "No Contact Info",
            securityDeposit: securityDeposit
        };
    });

    return res.status(200).json({
        success: true,
        message: "Sellers fetched successfully",
        data: processedSellers,
    });
});

/**
 * Apply penalty to seller wallet
 */
export const applySellerPenalty = asyncHandler(async (req: Request, res: Response) => {
    const { sellerId, amount, reason, orderId, note } = req.body;
    const adminId = req.user!.userId;

    if (!sellerId || !amount || !reason) {
        return res.status(400).json({
            success: false,
            message: "Seller ID, amount, and reason are required",
        });
    }

    const penaltyAmount = Number(amount);
    if (isNaN(penaltyAmount) || penaltyAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid penalty amount",
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const seller = await Seller.findById(sellerId).session(session);
        if (!seller) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: "Seller not found",
            });
        }

        // Ensure securityDeposit has a value if it's missing in DB
        if (seller.securityDeposit === undefined || seller.securityDeposit === null || isNaN(seller.securityDeposit)) {
            seller.securityDeposit = seller.depositAmount || 1000;
        }

        if (seller.securityDeposit < penaltyAmount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: "Insufficient security deposit balance for this penalty",
            });
        }

        // 1. Deduct from security deposit
        seller.securityDeposit -= penaltyAmount;
        await seller.save({ session });

        // 2. Create transaction record
        const transaction = new SellerWalletTransaction({
            sellerId,
            amount: penaltyAmount,
            type: "Debit",
            reason,
            orderId,
            note,
            createdBy: adminId,
        });
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Penalty applied successfully",
            data: {
                transaction,
                newBalance: seller.securityDeposit,
            },
        });
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error applying seller penalty:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to apply penalty",
        });
    }
});
