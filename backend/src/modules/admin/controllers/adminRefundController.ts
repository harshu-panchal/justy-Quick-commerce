import { Request, Response } from 'express';
import { EquipmentOrder, RefundRequest } from '../../../models';
import { refundEquipmentOrder } from '../../../services/equipmentPaymentService';

export const getAllRefundRequests = async (_req: Request, res: Response) => {
    try {
        const requests = await RefundRequest.find()
            .populate('orderId', 'orderNumber total status paymentStatus')
            .populate('sellerId', 'sellerName email mobile')
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateRefundStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, adminNote, transactionRef } = req.body;

        const refundRequest = await RefundRequest.findById(id);
        if (!refundRequest) return res.status(404).json({ success: false, message: 'Refund request not found' });

        if (refundRequest.status === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Refund already completed' });
        }

        refundRequest.status = status;
        if (adminNote) refundRequest.adminNote = adminNote;
        if (transactionRef) refundRequest.transactionRef = transactionRef;
        if (status === 'COMPLETED') {
            refundRequest.refundDate = new Date();
        }

        await refundRequest.save();

        // Update Order status accordingly
        const order = await EquipmentOrder.findById(refundRequest.orderId);
        if (order) {
            if (status === 'COMPLETED') {
                order.refundStatus = 'REFUNDED';
                order.refundTransactionId = transactionRef || 'MANUAL-BANK';
                order.paymentStatus = 'Refunded';
                // Note: The order status is already 'cancelled' or 'rejected'
                // We keep it as is or could update to 'refunded' if desired.
                // The user requirements say order.refundStatus = "REFUNDED"
            } else if (status === 'REJECTED') {
                order.refundStatus = 'REJECTED';
            }
            await order.save();
        }

        const message = status === 'COMPLETED' ? 'Refund completed' : (status === 'REJECTED' ? 'Refund rejected' : 'Refund status updated');

        return res.status(200).json({ success: true, message, data: refundRequest });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const processRazorpayRefund = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const refundRequest = await RefundRequest.findById(id).populate('orderId');
        if (!refundRequest) return res.status(404).json({ success: false, message: 'Refund request not found' });
        
        if (refundRequest.status === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Refund already completed' });
        }

        const order = refundRequest.orderId as any;
        if (!order || order.paymentMethod !== 'Online' || !order.razorpayPaymentId) {
            return res.status(400).json({ success: false, message: 'Order is not eligible for Razorpay refund (must be Paid Online)' });
        }

        // Call the existing refund service
        const refundResult = await refundEquipmentOrder(order._id, 'BANK');

        if (refundResult.success && refundResult.data) {
            refundRequest.status = 'COMPLETED';
            refundRequest.transactionRef = refundResult.data?.refundTransactionId;
            refundRequest.refundDate = new Date();
            refundRequest.adminNote = (refundRequest.adminNote || "") + " | Processed via Razorpay Test Refund";
            await refundRequest.save();

            // The refundEquipmentOrder service already updates the Order status and refundStatus
            
            return res.status(200).json({ 
                success: true, 
                message: 'Razorpay refund processed successfully', 
                data: refundRequest 
            });
        } else {
            return res.status(400).json({ success: false, message: refundResult.message });
        }
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
