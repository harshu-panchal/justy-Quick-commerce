import mongoose from 'mongoose';
import Seller from "../../../models/Seller";
import Product from "../../../models/Product";
import Executive from "../../../models/Executive";
import CategoryCommission from "../../../models/CategoryCommission";
import ExecutiveWalletTransaction from "../../../models/ExecutiveWalletTransaction";

/**
 * Check if a seller is eligible for commission and credit the referring executive.
 * Logic: Verified (Approved) + Deposit Paid + First Product Added.
 */
export const checkAndCreditCommission = async (sellerId: string) => {
  console.log(`[Commission] Starting check for Seller ID: ${sellerId}`);
  try {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      console.log(`[Commission] Seller not found: ${sellerId}`);
      return;
    }
    if (!seller.referredBy) {
      console.log(`[Commission] Seller ${seller.storeName} has no referring executive.`);
      return;
    }

    // 1. Check basic conditions
    const isApproved = seller.status === 'Approved';
    const isDepositPaid = seller.depositPaid === true;
    
    console.log(`[Commission] Conditions for ${seller.storeName}: Approved=${isApproved}, DepositPaid=${isDepositPaid}`);
    
    if (!isApproved || !isDepositPaid) return;

    // 2. Check if product exists (any status)
    const productCount = await Product.countDocuments({ seller: sellerId });
    console.log(`[Commission] Product count for ${seller.storeName}: ${productCount}`);
    if (productCount === 0) return;

    // 3. Check if commission already credited for this seller
    const alreadyCredited = await ExecutiveWalletTransaction.findOne({
      referenceId: seller._id,
      source: 'Commission'
    });
    
    if (alreadyCredited) {
      console.log(`[Commission] Commission already credited for ${seller.storeName}. Syncing flag...`);
      if (!seller.commissionCredited) {
        seller.commissionCredited = true;
        await seller.save();
      }
      return;
    }

    // 4. Get commission amount for category (case-insensitive)
    const commission = await CategoryCommission.findOne({ 
      categoryName: { $regex: new RegExp(`^${seller.category}$`, 'i') } 
    });
    
    const creditAmount = commission ? commission.amount : 100;
    console.log(`[Commission] Category: ${seller.category}, Match Found: ${!!commission}, Amount: ${creditAmount}`);

    // 5. Credit Executive Wallet
    const executive = await Executive.findById(seller.referredBy);
    if (!executive) {
      console.log(`[Commission] Executive not found for ID: ${seller.referredBy}`);
      return;
    }

    const oldBalance = executive.walletBalance;
    executive.walletBalance += creditAmount;
    executive.onboardedSellersCount += 1;
    await executive.save();
    console.log(`[Commission] Credited ₹${creditAmount} to Executive ${executive.name}. Balance: ${oldBalance} -> ${executive.walletBalance}`);

    // 6. Update Seller
    seller.commissionCredited = true;
    seller.commissionAmount = creditAmount;
    seller.hasAddedFirstProduct = true;
    await seller.save();
    console.log(`[Commission] Seller ${seller.storeName} updated with commissionCredited=true`);

    // 7. Log Transaction
    await ExecutiveWalletTransaction.create({
      executive: executive._id,
      type: 'Credit',
      amount: creditAmount,
      description: `Commission for onboarding seller: ${seller.storeName} (${seller.category})`,
      source: 'Commission',
      referenceId: seller._id,
      balanceAfter: executive.walletBalance
    });

    console.log(`[Commission] Success! Credited ₹${creditAmount} to Executive ${executive.name} for Seller ${seller.storeName}`);
  } catch (error) {
    console.error('[Commission Error]', error);
  }
};

/**
 * Synchronize all pending commissions for an executive.
 * Useful for fixing data gaps during dashboard loads.
 */
export const syncExecutiveCommissions = async (executiveId: string) => {
  console.log(`[Commission Sync] Syncing for Executive ID: ${executiveId}`);
  try {
    const pendingSellers = await Seller.find({ 
      referredBy: new mongoose.Types.ObjectId(executiveId), 
      commissionCredited: { $ne: true },
      depositPaid: true,
      status: 'Approved'
    });

    console.log(`[Commission Sync] Found ${pendingSellers.length} eligible pending sellers.`);

    if (pendingSellers.length > 0) {
      for (const seller of pendingSellers) {
        await checkAndCreditCommission(seller._id.toString());
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Commission Sync Error]', error);
    return false;
  }
};
