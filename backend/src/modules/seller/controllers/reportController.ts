import { Request, Response } from "express";
import mongoose from "mongoose";
import OrderItem from "../../../models/OrderItem";
import Order from "../../../models/Order";
import { asyncHandler } from "../../../utils/asyncHandler";

/**
 * Get seller's sales report with filters, sorting, and pagination
 */
export const getSalesReport = asyncHandler(
    async (req: Request, res: Response) => {
        const sellerId = new mongoose.Types.ObjectId((req as any).user.userId);
        const {
            fromDate,
            toDate,
            search,
            page = "1",
            limit = "10",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        // Build query - filter by authenticated seller
        const query: any = { seller: sellerId };

        // Date range filter
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                query.createdAt.$gte = new Date(fromDate as string);
            }
            if (toDate) {
                // Set to end of day
                const endDay = new Date(toDate as string);
                endDay.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDay;
            }
        }

        // Search filter (on product name or order ID)
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: "i" } },
                // If orderId is available as a string or regex matchable field
                // Note: orderId in OrderItem is an ObjectId pointing to Order model
            ];
        }

        // Pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Sort
        const sort: any = {};
        sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

        // Get order items with populated order info
        const orderItems = await OrderItem.find(query)
            .populate({
                path: "order",
                select: "orderNumber createdAt"
            })
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination
        const total = await OrderItem.countDocuments(query);

        // Format response for frontend
        const reports = orderItems.map(item => ({
            orderId: (item.order as any)?.orderNumber || '',
            orderItemId: item._id.toString().slice(-4), // SR No / Item ID shortcut
            product: item.productName,
            variant: item.variantTitle,
            total: item.subtotal,
            date: item.createdAt.toISOString().replace('T', ' ').split('.')[0], // YYYY-MM-DD HH:mm:ss
        }));

        return res.status(200).json({
            success: true,
            message: "Sales report fetched successfully",
            data: reports,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    }
);
/**
 * Get seller's general analytics and business insights
 */
export const getAnalytics = asyncHandler(
    async (req: Request, res: Response) => {
        const sellerId = new mongoose.Types.ObjectId((req as any).user.userId);

        // 1. Top Dish / Product (Aggregation)
        const topProducts = await OrderItem.aggregate([
            { $match: { seller: sellerId } },
            {
                $group: {
                    _id: "$productName",
                    orders: { $sum: 1 },
                    revenue: { $sum: "$subtotal" }
                }
            },
            { $sort: { orders: -1 } },
            { $limit: 5 }
        ]);

        const topDish = topProducts[0] || { _id: 'No Sales Yet', orders: 0 };

        // 3. Recurring Customers
        // Group orders by customer and count those with more than 1 order
        const sellerOrderItems = await OrderItem.find({ seller: sellerId }).select('order');
        const sellerOrderIds = [...new Set(sellerOrderItems.map(item => item.order.toString()))];

        const customerStats = await Order.aggregate([
            { $match: { _id: { $in: sellerOrderIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            {
                $group: {
                    _id: "$customer",
                    orderCount: { $sum: 1 }
                }
            }
        ]);
        
        const totalCustomers = customerStats.length;
        const recurringCount = customerStats.filter((c: any) => c.orderCount > 1).length;
        const recurringRate = totalCustomers > 0 ? Math.round((recurringCount / totalCustomers) * 100) : 0;

        // 4. Sales Trends (Weekly bars - last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const weeklyTrends = await OrderItem.aggregate([
            { 
                $match: { 
                    seller: sellerId,
                    createdAt: { $gte: sevenDaysAgo }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$subtotal" }
                }
            }
        ]);

        const salesTrends = last7Days.map(date => {
            const dayData = weeklyTrends.find(t => t._id === date);
            return dayData ? dayData.total : 0;
        });

        // 5. Week Total
        const weekTotal = salesTrends.reduce((a, b) => a + b, 0);

        // 6. Growth (Current 7 days vs Previous 7 days)
        const prev7End = new Date(sevenDaysAgo);
        const prev7Start = new Date(sevenDaysAgo);
        prev7Start.setDate(prev7Start.getDate() - 7);

        const prev7TotalRaw = await OrderItem.aggregate([
            { 
                $match: { 
                    seller: sellerId,
                    createdAt: { $gte: prev7Start, $lt: prev7End }
                } 
            },
            { $group: { _id: null, total: { $sum: "$subtotal" } } }
        ]);

        const prev7Total = prev7TotalRaw[0]?.total || 0;
        let growthStr = "0%";
        if (prev7Total > 0) {
            const growthVal = ((weekTotal - prev7Total) / prev7Total) * 100;
            growthStr = `${growthVal >= 0 ? "+" : ""}${growthVal.toFixed(1)}%`;
        } else if (weekTotal > 0) {
            growthStr = "+100%";
        }

        // 7. Peak Hour (Aggregation on last 30 days orders)
        const peakHourData = await OrderItem.aggregate([
            { 
                $match: { 
                    seller: sellerId,
                    createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
                } 
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const peakHourVal = peakHourData[0]?._id;
        let peakHourStr = "N/A";
        if (peakHourVal !== undefined) {
             const h = (peakHourVal as number);
             const nextH = (h + 1) % 24;
             peakHourStr = `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'} - ${nextH % 12 || 12}${nextH >= 12 ? 'PM' : 'AM'}`;
        }

        // 8. Delivery Time (Average deliveredAt - createdAt)
        // Find delivered orders for this seller
        const deliveredOrders = await Order.find({
            _id: { $in: sellerOrderIds.map(id => new mongoose.Types.ObjectId(id)) },
            status: "Delivered",
            deliveredAt: { $exists: true }
        }).select('createdAt deliveredAt');

        let avgDeliveryTime = "24 mins";
        if (deliveredOrders.length > 0) {
            const totalMins = deliveredOrders.reduce((sum, order) => {
                const diff = (order.deliveredAt!.getTime() - order.createdAt.getTime()) / (1000 * 60);
                return sum + diff;
            }, 0);
            const avg = Math.round(totalMins / deliveredOrders.length);
            avgDeliveryTime = `${avg} mins`;
        } else {
             avgDeliveryTime = "Pending Data";
        }

        return res.status(200).json({
            success: true,
            data: {
                metrics: [
                    { label: 'TOP DISH', value: topDish._id, desc: `${topDish.orders} Orders overall`, icon: '🥘' },
                    { label: 'DELIVERY TIME', value: avgDeliveryTime, desc: 'Average time to handover', icon: '⏰' },
                    { label: 'RECURRING CUSTOMERS', value: `${recurringRate}%`, desc: `${recurringCount} users ordered more than once`, icon: '🔄' },
                ],
                salesTrends,
                weekTotal,
                peakHour: peakHourStr,
                growth: growthStr,
                topRevenueItem: topDish._id
            }
        });
    }
);

/**
 * Get seller's growth insights and promotion performance
 */
export const getGrowthInsights = asyncHandler(
    async (req: Request, res: Response) => {
        const sellerId = new mongoose.Types.ObjectId((req as any).user.userId);

        const promoStats = await OrderItem.aggregate([
            { 
                $match: { 
                    seller: sellerId,
                    comboOffer: { $exists: true, $ne: null }
                } 
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const recentOrders = await OrderItem.countDocuments({
            seller: sellerId,
            createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 1)) }
        });

        let visibilityScore = "Standard";
        if (recentOrders > 20) visibilityScore = "Elite";
        else if (recentOrders > 5) visibilityScore = "Promoted";

        return res.status(200).json({
            success: true,
            data: {
                promoRevenue: promoStats[0]?.revenue || 0,
                promoOrders: promoStats[0]?.count || 0,
                visibilityScore,
                activeCampaigns: 0,
                recommendations: [
                    { title: "Peak Hour Boost", impact: "High", action: "Activate 10% discount between 8PM-10PM" },
                    { title: "Bundle Synergy", impact: "Medium", action: "Create combo for your Top Dish" }
                ]
            }
        });
    }
);
