import mongoose from "mongoose";
import { Request, Response } from "express";
import Executive from "../../../models/Executive";
import Seller from "../../../models/Seller";
import ExecutiveWithdrawal from "../../../models/ExecutiveWithdrawal";
import ExecutiveWalletTransaction from "../../../models/ExecutiveWalletTransaction";
import { asyncHandler } from "../../../utils/asyncHandler";
import { syncExecutiveCommissions } from "../utils/commissionHelper";

/**
 * Get Executive Dashboard Stats
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const executiveId = (req as any).user.userId;
  console.log(`[Dashboard] Fetching stats for executive: ${executiveId}`);

  let executive = await Executive.findById(executiveId);
  if (!executive) {
    return res.status(404).json({
      success: false,
      message: "Executive not found",
    });
  }

  // Check for suspension
  if (executive.status === 'Suspended') {
    return res.status(403).json({
      success: false,
      message: "Your account has been suspended. Please contact admin.",
    });
  }

  // Passive Sync: Check for missing commissions before sending stats
  try {
    console.log(`[Dashboard] Triggering syncExecutiveCommissions...`);
    const wasUpdated = await syncExecutiveCommissions(executiveId.toString());
    console.log(`[Dashboard] Sync result: ${wasUpdated}`);
    if (wasUpdated) {
        // Re-fetch to get updated walletBalance
        executive = await Executive.findById(executiveId);
        console.log(`[Dashboard] Executive re-fetched. New balance: ${executive?.walletBalance}`);
    }
  } catch (err) {
      console.error("Dashboard sync error:", err);
  }

  // Fallback: If for some reason referralCode is missing, generate and save it now
  if (!executive.referralCode) {
    let code = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const namePart = (executive.name || "EXC").substring(0, 3).toUpperCase().padEnd(3, "X");
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      code = `${namePart}${randomPart}`;
      const existing = await Executive.findOne({ referralCode: code });
      if (!existing) isUnique = true;
      attempts++;
    }
    executive.referralCode = code;
    await executive.save();
  }

  const totalSellers = await Seller.countDocuments({ referredBy: new mongoose.Types.ObjectId(executiveId) });
  const pendingVerification = await Seller.countDocuments({ referredBy: new mongoose.Types.ObjectId(executiveId), status: 'Pending' });
  const paidSellers = await Seller.countDocuments({ referredBy: new mongoose.Types.ObjectId(executiveId), depositPaid: true });
  const commissionedSellers = await Seller.countDocuments({ referredBy: new mongoose.Types.ObjectId(executiveId), commissionCredited: true });
  
  // Updated KYC check logic for new kycDetails structure
  const kyc = executive.kycDetails || {};
  const isKycMissing = !kyc.aadharFront || !kyc.panCard || !kyc.resume || !kyc.bankPassbook;
  const pendingKYC = executive.kycStatus === 'Pending' || isKycMissing;

  console.log('📊 Dashboard stats being sent:', {
    id: executive._id,
    name: executive.name,
    referralCode: executive.referralCode,
    walletBalance: executive.walletBalance,
    totalSellers,
    pendingVerification,
    paidSellers,
    commissionedSellers
  });

  return res.status(200).json({
    success: true,
    data: {
      walletBalance: executive.walletBalance,
      onboardedSellers: totalSellers,
      pendingVerification,
      paidSellers,
      commissionedSellers,
      kycStatus: executive.kycStatus,
      status: executive.status,
      referralCode: executive.referralCode,
      pendingKYC,
      kycVerifiedAt: executive.kycVerifiedAt
    },
  });
});

/**
 * Get Onboarded Sellers
 */
export const getOnboardedSellers = asyncHandler(async (req: Request, res: Response) => {
  const executiveId = (req as any).user.userId;

  // Passive check to credit any missing commissions
  try {
    console.log(`[Sellers] Triggering syncExecutiveCommissions...`);
    await syncExecutiveCommissions(executiveId.toString());
  } catch (err) {
      console.error("Sellers list sync error:", err);
  }

  const sellers = await Seller.find({ referredBy: new mongoose.Types.ObjectId(executiveId) })
    .select("storeName sellerName mobile status depositPaid createdAt category hasAddedFirstProduct commissionCredited commissionAmount")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: sellers,
  });
});

/**
 * Get Wallet Transactions
 */
export const getWalletTransactions = asyncHandler(async (req: Request, res: Response) => {
  const executiveId = (req as any).user.userId;

  const transactions = await ExecutiveWalletTransaction.find({ executive: executiveId })
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: transactions,
  });
});

/**
 * Request Withdrawal
 */
export const requestWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const executiveId = (req as any).user.userId;
  const { amount, bankDetails } = req.body;

  const executive = await Executive.findById(executiveId);
  if (!executive) return res.status(404).json({ success: false, message: "Executive not found" });

  // Threshold Check: 10 sellers (Temporarily disabled for testing)
  // const sellerCount = await Seller.countDocuments({ referredBy: executiveId });
  // if (sellerCount < 10) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Minimum 10 onboarded sellers required for withdrawal eligibility.",
  //   });
  // }

  // Balance Check
  if (executive.walletBalance < amount) {
    return res.status(400).json({
      success: false,
      message: "Insufficient wallet balance",
    });
  }

  // Extract bank details from dynamicKycData if not provided
  const dynamicKyc = executive.dynamicKycData || {};
  const extractedBankDetails = {
    accountName: dynamicKyc['Account Holder Name'] || dynamicKyc['Account Name'] || dynamicKyc['Name as per Bank'] || executive.name,
    accountNumber: dynamicKyc['Account Number'] || dynamicKyc['Bank Account Number'] || 'N/A',
    bankName: dynamicKyc['Bank Name'] || dynamicKyc['Bank'] || 'N/A',
    ifsc: dynamicKyc['IFSC Code'] || dynamicKyc['IFSC'] || 'N/A'
  };

  // Create Withdrawal Request
  const withdrawal = await ExecutiveWithdrawal.create({
    executive: executiveId,
    amount,
    bankDetails: bankDetails || extractedBankDetails,
    status: 'Pending'
  });

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid withdrawal amount" });
  }

  if (executive.walletBalance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
  }

  // Debit from wallet balance (locked for payout)
  executive.walletBalance -= amount;
  await executive.save();

  // Log transaction
  await ExecutiveWalletTransaction.create({
    executive: executiveId,
    type: 'Debit',
    amount,
    description: `Withdrawal request for ₹${amount}`,
    source: 'Withdrawal',
    referenceId: withdrawal._id,
    balanceAfter: executive.walletBalance
  });

  return res.status(201).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    data: withdrawal,
  });
});
