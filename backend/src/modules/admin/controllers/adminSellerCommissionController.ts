import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import Seller from "../../../models/Seller";
import HeaderCategory from "../../../models/HeaderCategory";
import SellerCategoryCommission from "../../../models/SellerCategoryCommission";

/**
 * Get category commissions for a specific seller
 * Returns the list of categories assigned to the seller with their custom rates
 */
export const getSellerCategoryCommissions = asyncHandler(async (req: Request, res: Response) => {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
        return res.status(404).json({
            success: false,
            message: "Seller not found",
        });
    }

    // Combine unique categories from both singular 'category' and plural 'categories' fields
    const sellerCategories = new Set<string>();
    if (seller.category) sellerCategories.add(seller.category);
    if (seller.categories && Array.isArray(seller.categories)) {
        seller.categories.forEach(cat => sellerCategories.add(cat));
    }

    const categoryNames = Array.from(sellerCategories);

    // Resolve these names to HeaderCategory IDs case-insensitively
    const headerCategories = await HeaderCategory.find({
        name: { $in: categoryNames.map(name => new RegExp(`^${name}$`, 'i')) }
    });

    const categoryCommissions = await Promise.all(
        headerCategories.map(async (cat) => {
            const custom = await SellerCategoryCommission.findOne({
                seller: sellerId,
                headerCategory: cat._id,
            });

            return {
                headerCategoryId: cat._id,
                name: cat.name,
                commissionRate: custom ? custom.commissionRate : null, // null if no custom rate set
            };
        })
    );

    return res.status(200).json({
        success: true,
        data: categoryCommissions,
    });
});

/**
 * Save category commissions for a specific seller
 * Body: { commissions: [{ headerCategoryId, commissionRate }] }
 */
export const saveSellerCategoryCommissions = asyncHandler(async (req: Request, res: Response) => {
    const { sellerId } = req.params;
    const { commissions } = req.body;

    if (!Array.isArray(commissions)) {
        return res.status(400).json({
            success: false,
            message: "Invalid commissions data",
        });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
        return res.status(404).json({
            success: false,
            message: "Seller not found",
        });
    }

    for (const comm of commissions) {
        const { headerCategoryId, commissionRate } = comm;
        
        if (headerCategoryId && commissionRate !== undefined) {
            await SellerCategoryCommission.findOneAndUpdate(
                { seller: sellerId, headerCategory: headerCategoryId },
                { commissionRate },
                { upsert: true, new: true }
            );
        }
    }

    return res.status(200).json({
        success: true,
        message: "Category commissions updated successfully",
    });
});
