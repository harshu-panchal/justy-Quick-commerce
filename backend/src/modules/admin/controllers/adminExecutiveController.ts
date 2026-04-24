import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Executive from "../../../models/Executive";
import Seller from "../../../models/Seller";
import CategoryCommission from "../../../models/CategoryCommission";
import ExecutiveWithdrawal from "../../../models/ExecutiveWithdrawal";
import ExecutiveWalletTransaction from "../../../models/ExecutiveWalletTransaction";

/**
 * Get all executives
 */
export const getExecutives = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        status,
    } = req.query;

    const query: any = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
            { referralCode: { $regex: search, $options: "i" } },
        ];
    }
    if (status) {
        query.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [executives, total] = await Promise.all([
        Executive.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string)),
        Executive.countDocuments(query),
    ]);

    // Add seller count for each executive
    const executivesWithCount = await Promise.all(executives.map(async (exec) => {
        const sellerCount = await Seller.countDocuments({ 
            referredBy: exec._id,
            status: 'Approved'
        });
        return {
            ...exec.toObject(),
            sellerCount
        };
    }));

    return res.status(200).json({
        success: true,
        message: "Executives fetched successfully",
        data: executivesWithCount,
        pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
        },
    });
});

/**
 * Get executive by ID
 */
export const getExecutiveById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const executive = await Executive.findById(id);

    if (!executive) {
        return res.status(404).json({ success: false, message: "Executive not found" });
    }

    const sellerCount = await Seller.countDocuments({ referredBy: executive._id, status: 'Approved' });

    return res.status(200).json({
        success: true,
        data: {
            ...executive.toObject(),
            sellerCount
        },
    });
});

/**
 * Create a new executive (Manual Admin Add)
 */
export const createExecutive = asyncHandler(async (req: Request, res: Response) => {
    const { name, mobile, email, alternateMobile, workExperience } = req.body;

    if (!name || !mobile || !email) {
        return res.status(400).json({ success: false, message: "Name, mobile, and email are required" });
    }

    const existing = await Executive.findOne({ $or: [{ mobile }, { email }] });
    if (existing) {
        return res.status(400).json({ success: false, message: "Executive already exists with this mobile or email" });
    }

    const executive = await Executive.create({
        name,
        mobile,
        email,
        alternateMobile,
        workExperience,
        status: 'Active',
        isOtpVerified: true
    });

    return res.status(201).json({
        success: true,
        message: "Executive created successfully",
        data: executive,
    });
});

/**
 * Update executive status / KYC status
 */
export const updateExecutive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, kycStatus, isActive, rejectionReason } = req.body;

    const executive = await Executive.findById(id);
    if (!executive) {
        return res.status(404).json({ success: false, message: "Executive not found" });
    }

    if (status) executive.status = status;
    if (kycStatus) {
        executive.kycStatus = kycStatus;
        if (kycStatus === 'Approved') {
            executive.kycVerifiedAt = new Date();
        }
    }
    if (isActive !== undefined) executive.isActive = isActive;
    if (rejectionReason) executive.rejectionReason = rejectionReason;

    await executive.save();

    return res.status(200).json({
        success: true,
        message: "Executive updated successfully",
        data: executive,
    });
});

/**
 * Category Commissions
 */
export const getCategoryCommissions = asyncHandler(async (_req: Request, res: Response) => {
    const commissions = await CategoryCommission.find().sort({ categoryName: 1 });
    return res.status(200).json({ success: true, data: commissions });
});

export const updateCategoryCommission = asyncHandler(async (req: Request, res: Response) => {
    const { categoryName, amount } = req.body;

    if (!categoryName) return res.status(400).json({ success: false, message: "Category name is required" });

    const commission = await CategoryCommission.findOneAndUpdate(
        { categoryName },
        { amount },
        { upsert: true, new: true }
    );

    return res.status(200).json({
        success: true,
        message: "Commission updated successfully",
        data: commission
    });
});

/**
 * Withdrawal Management
 */
export const getWithdrawalRequests = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    const query: any = {};
    if (status) query.status = status;

    const requests = await ExecutiveWithdrawal.find(query)
        .populate("executive", "name mobile email referralCode")
        .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: requests });
});

export const processWithdrawal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNote, transactionId } = req.body;

    const request = await ExecutiveWithdrawal.findById(id).populate("executive");
    if (!request) return res.status(404).json({ success: false, message: "Withdrawal request not found" });

    if (request.status === 'Paid') {
        return res.status(400).json({ success: false, message: "Request already marked as paid" });
    }

    request.status = status;
    if (adminNote) request.adminNote = adminNote;
    if (transactionId) request.transactionId = transactionId;
    if (status === 'Paid') request.processedDate = new Date();

    await request.save();

    // If rejected, refund to wallet
    if (status === 'Rejected') {
        const executive = await Executive.findById(request.executive._id);
        if (executive) {
            executive.walletBalance += request.amount;
            await executive.save();

            await ExecutiveWalletTransaction.create({
                executive: executive._id,
                type: 'Credit',
                amount: request.amount,
                description: `Refund for rejected withdrawal request #${request._id}`,
                source: 'Correction',
                referenceId: request._id,
                balanceAfter: executive.walletBalance
            });
        }
    }

    return res.status(200).json({
        success: true,
        message: `Withdrawal request ${status} successfully`,
        data: request
    });
});

/**
 * Delete executive
 */
export const deleteExecutive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const executive = await Executive.findByIdAndDelete(id);
    if (!executive) {
        return res.status(404).json({ success: false, message: "Executive not found" });
    }

    return res.status(200).json({
        success: true,
        message: "Executive deleted successfully",
    });
});

/**
 * Get public list of executives (e.g. for selection during seller signup if needed)
 */
export const getPublicExecutives = asyncHandler(async (_req: Request, res: Response) => {
    const executives = await Executive.find({ status: 'Active' })
        .select("name referralCode");

    return res.status(200).json({
        success: true,
        data: executives
    });
});
