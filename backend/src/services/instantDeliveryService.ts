import { Server as SocketIOServer } from "socket.io";
import Order from "../models/Order";
import Delivery from "../models/Delivery";
import DeliveryAssignment from "../models/DeliveryAssignment";
import mongoose from "mongoose";

/**
 * Service to handle Instant Delivery (Quick Commerce) workflow
 */
export class InstantDeliveryService {
    private io: SocketIOServer;

    constructor(io: SocketIOServer) {
        this.io = io;
    }

    /**
     * Broadcast an instant order to delivery partners in the same pincode
     */
    async broadcastOrder(orderId: string) {
        try {
            const order = await Order.findById(orderId).populate("items");
            if (!order || order.deliveryType !== "instant") return;

            const sellerPincode = order.sellerPincode;
            if (!sellerPincode) {
                console.error(`[InstantDelivery] Order ${orderId} has no sellerPincode`);
                return;
            }

            // Find active, online delivery partners in the same pincode
            const partners = await Delivery.find({
                pincode: sellerPincode,
                isOnline: true,
                status: "Active",
            });

            if (partners.length === 0) {
                console.log(`[InstantDelivery] No available partners found for pincode ${sellerPincode}`);
                // We still set the timeout in case someone comes online, 
                // but ideally we notify admin or handle "no partners" case.
            }

            const orderData = {
                orderId: order._id,
                orderNumber: order.orderNumber,
                total: order.total,
                pincode: sellerPincode,
                address: order.deliveryAddress.address,
                createdAt: order.createdAt,
            };

            // Broadcast to partners in the same pincode room or individually
            partners.forEach((partner) => {
                this.io.to(`delivery-${partner._id}`).emit("new_delivery_request", orderData);
            });

            console.log(`[InstantDelivery] Broadcasted order ${order.orderNumber} to ${partners.length} partners in ${sellerPincode}`);

            // Set 2-minute timeout for auto-cancellation
            setTimeout(async () => {
                await this.checkAndCancelIfUnassigned(orderId);
            }, 2 * 60 * 1000);

        } catch (error) {
            console.error(`[InstantDelivery] Error broadcasting order ${orderId}:`, error);
        }
    }

    /**
     * Check if order is still unassigned after timeout and cancel if necessary
     */
    private async checkAndCancelIfUnassigned(orderId: string) {
        try {
            const order = await Order.findById(orderId);
            if (!order || order.status === "Cancelled" || order.status === "Delivered") return;

            // Check if a DeliveryAssignment exists for this order
            const assignment = await DeliveryAssignment.findOne({ order: orderId });

            if (!assignment) {
                order.status = "Cancelled";
                order.cancellationReason = "No delivery partner accepted the request within 2 minutes";
                await order.save();

                // Notify customer
                this.io.to(`order-${orderId}`).emit("order_cancelled", {
                    orderId,
                    reason: order.cancellationReason,
                });

                console.log(`[InstantDelivery] Order ${order.orderNumber} auto-cancelled due to timeout`);
            }
        } catch (error) {
            console.error(`[InstantDelivery] Error in timeout check for order ${orderId}:`, error);
        }
    }

    /**
     * Atomic acceptance of an order by a delivery partner
     */
    async acceptOrder(orderId: string, deliveryBoyId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Check if order already accepted (Atomic check via DeliveryAssignment unique constraint)
            // We use findOneAndUpdate with upsert: false first to see if it exists
            const existingAssignment = await DeliveryAssignment.findOne({ order: orderId }).session(session);

            if (existingAssignment) {
                await session.abortTransaction();
                return { success: false, message: "Order already accepted by another delivery partner" };
            }

            // Create assignment
            const newAssignment = new DeliveryAssignment({
                order: orderId,
                deliveryBoy: deliveryBoyId,
                status: "Accepted",
                assignedAt: new Date(),
                acceptedAt: new Date(),
                assignedBy: deliveryBoyId, // Self-assigned for instant orders
                assignedByModel: "Delivery",
            });

            await newAssignment.save({ session });

            // Update Order status
            const order = await Order.findByIdAndUpdate(
                orderId,
                {
                    deliveryBoy: deliveryBoyId,
                    deliveryBoyStatus: "Accepted",
                    status: "Processed",
                    assignedAt: new Date(),
                },
                { session, new: true }
            );

            await session.commitTransaction();

            // Notify others to remove the request
            this.io.emit("order_taken", { orderId, deliveryBoyId });

            // Notify customer
            this.io.to(`order-${orderId}`).emit("delivery_partner_assigned", {
                orderId,
                deliveryBoyId,
            });

            return { success: true, message: "Order accepted successfully", order };

        } catch (error: any) {
            await session.abortTransaction();
            console.error(`[InstantDelivery] Error accepting order ${orderId}:`, error);
            return { success: false, message: error.message || "Failed to accept order" };
        } finally {
            session.endSession();
        }
    }
}
