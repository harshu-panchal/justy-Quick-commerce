import { Server as SocketIOServer } from 'socket.io';

/**
 * Notify a delivery boy about a new assignment
 */
export async function notifyDeliveryBoyOfAssignment(
    io: SocketIOServer,
    deliveryBoyId: string,
    order: any,
    orderType: 'ORDER' | 'EQUIPMENT'
): Promise<void> {
    try {
        if (!io) {
            console.error('Socket.io server not provided to notifyDeliveryBoyOfAssignment');
            return;
        }

        const normalizedDeliveryBoyId = String(deliveryBoyId).trim();
        
        const notificationData = {
            type: 'NEW_ASSIGNMENT',
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderType,
            status: order.status,
            seller: {
                name: orderType === 'ORDER' ? (order.sellerName || 'Seller') : (order.sellerName || 'Seller'),
                address: orderType === 'ORDER' ? order.sellerAddress : order.sellerAddress,
                phone: orderType === 'ORDER' ? order.sellerPhone : order.sellerPhone
            },
            address: orderType === 'ORDER' ? order.deliveryAddress?.address || order.address : order.sellerAddress, // For equipment, sellerAddress is the destination
            totalAmount: order.total || order.grandTotal,
            timestamp: new Date()
        };

        // Emit to delivery-specific room
        io.to(`delivery-${normalizedDeliveryBoyId}`).emit('delivery-notification', notificationData);
        // Also emit to general delivery-notifications channel if UI listens for global pings
        io.to('delivery-notifications').emit('delivery-notification', notificationData);
        
        console.log(`📤 Emitted assignment notification to delivery-${normalizedDeliveryBoyId} for ${orderType} ${order.orderNumber}`);
    } catch (error) {
        console.error('Error in notifyDeliveryBoyOfAssignment:', error);
    }
}
