import { Request, Response } from "express";
import Seller from "../../../models/Seller";
import Product from "../../../models/Product";

/**
 * Get quick delivery products based on user pincode
 * Logic:
 * 1. Find approved sellers in the same pincode with active status and open shops
 * 2. Get active products from those sellers
 */
export const getQuickDeliveryProducts = async (req: Request, res: Response) => {
    try {
        const { pincode } = req.query;

        if (!pincode) {
            return res.status(400).json({
                success: false,
                message: "Pincode is required",
            });
        }

        // 1. Find sellers that match the pincode and are active
        const localSellers = await Seller.find({
            pincode: pincode as string,
            status: "Approved",
            isShopOpen: true,
            depositPaid: true,
            isPincodeActive: true,
        }).select("_id sellerName logo storeName");

        if (!localSellers || localSellers.length === 0) {
            return res.status(200).json({
                success: true,
                available: false,
                message: "No sellers available in your area yet.",
                products: [],
                sellers: [],
            });
        }

        const sellerIds = localSellers.map((s) => s._id);

        // 2. Fetch products from these sellers
        // We limit to 20 for a "Quick Delivery" section to keep it fast
        const products = await Product.find({
            seller: { $in: sellerIds },
            status: "Active",
            publish: true,
            stock: { $gt: 0 },
        })
            .limit(20)
            .populate("seller", "sellerName logo storeName")
            .sort({ rating: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            available: true,
            data: {
                products,
                sellers: localSellers,
            },
        });
    } catch (error: any) {
        console.error("Error in getQuickDeliveryProducts:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
