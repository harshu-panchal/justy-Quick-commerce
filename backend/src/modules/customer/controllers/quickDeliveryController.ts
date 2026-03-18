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

        /**
         * Filter products that:
         * 1. Belong to these local sellers
         * 2. Are active, published, and in stock
         * 3. Have a HeaderCategory with deliveryType: 'quick' (either directly or via category)
         */
        const products = await Product.aggregate([
            {
                $match: {
                    seller: { $in: sellerIds },
                    status: "Active",
                    publish: true,
                    stock: { $gt: 0 },
                },
            },
            // Lookup HeaderCategory from product directly
            {
                $lookup: {
                    from: "headercategories",
                    localField: "headerCategoryId",
                    foreignField: "_id",
                    as: "directHeader",
                },
            },
            // Lookup Category to get its headerCategoryId
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "catDoc",
                },
            },
            { $unwind: { path: "$catDoc", preserveNullAndEmptyArrays: true } },
            // Lookup HeaderCategory from category
            {
                $lookup: {
                    from: "headercategories",
                    localField: "catDoc.headerCategoryId",
                    foreignField: "_id",
                    as: "catHeader",
                },
            },
            // Match if either direct header or category header is 'quick'
            {
                $match: {
                    $or: [
                        { "directHeader.deliveryType": "quick" },
                        {
                            $and: [
                                { headerCategoryId: { $exists: false } },
                                { "catHeader.deliveryType": "quick" },
                            ],
                        },
                        // Default to quick if NO header category is found at all (backwards compatibility for grocery)
                        {
                            $and: [
                                { headerCategoryId: { $exists: false } },
                                { "catDoc.headerCategoryId": { $exists: false } },
                            ],
                        },
                    ],
                },
            },
            { $sort: { rating: -1, createdAt: -1 } },
            { $limit: 20 },
            // Lookup seller details
            {
                $lookup: {
                    from: "sellers",
                    localField: "seller",
                    foreignField: "_id",
                    as: "sellerDetails",
                },
            },
            { $unwind: "$sellerDetails" },
            // Project to match expected frontend structure
            {
                $project: {
                    productName: 1,
                    smallDescription: 1,
                    description: 1,
                    mainImage: 1,
                    price: 1,
                    discPrice: 1,
                    compareAtPrice: 1,
                    stock: 1,
                    status: 1,
                    publish: 1,
                    rating: 1,
                    reviewsCount: 1,
                    discount: 1,
                    pack: 1,
                    tags: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    category: 1,
                    headerCategoryId: 1,
                    seller: {
                        _id: "$sellerDetails._id",
                        sellerName: "$sellerDetails.sellerName",
                        logo: "$sellerDetails.logo",
                        storeName: "$sellerDetails.storeName",
                    },
                },
            },
        ]);

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
