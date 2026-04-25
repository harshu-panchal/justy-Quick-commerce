import { Request, Response } from 'express';
import WithdrawRequest from '../../../models/WithdrawRequest';
import ExecutiveWithdrawal from '../../../models/ExecutiveWithdrawal';
import { debitWallet } from '../../../services/walletManagementService';
import mongoose from 'mongoose';

/**
 * Get all withdrawal requests
 */
export const getAllWithdrawals = async (req: Request, res: Response) => {
    try {
        const { status, userType, page = 1, limit = 20 } = req.query;

        const query: any = {};
        if (status) query.status = status;
        if (userType) query.userType = userType;

        const skip = (Number(page) - 1) * Number(limit);

        let requests: any[] = [];
        let total = 0;

        if (userType === 'EXECUTIVE') {
            requests = await ExecutiveWithdrawal.find(query)
                .populate('executive', 'name email mobile')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));
            
            total = await ExecutiveWithdrawal.countDocuments(query);

            // Normalize
            requests = requests.map(r => {
                const doc = r.toObject();
                return {
                    ...doc,
                    userId: doc.executive,
                    userType: 'EXECUTIVE',
                    paymentMethod: 'Bank Transfer',
                    accountDetails: `Name: ${doc.bankDetails?.accountName}, A/C: ${doc.bankDetails?.accountNumber}, Bank: ${doc.bankDetails?.bankName}, IFSC: ${doc.bankDetails?.ifsc}`
                };
            });
        } else if (userType && userType !== 'EXECUTIVE') {
            requests = await WithdrawRequest.find(query)
                .populate('userId', 'sellerName storeName name email mobile accountNumber bankName ifscCode')
                .populate('processedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));
            total = await WithdrawRequest.countDocuments(query);
        } else {
            // Merge both
            const [standardRequests, executiveRequests] = await Promise.all([
                WithdrawRequest.find(query)
                    .populate('userId', 'sellerName storeName name email mobile accountNumber bankName ifscCode')
                    .sort({ createdAt: -1 })
                    .limit(Number(limit) + skip),
                ExecutiveWithdrawal.find(query)
                    .populate('executive', 'name email mobile')
                    .sort({ createdAt: -1 })
                    .limit(Number(limit) + skip)
            ]);

            const normalizedExecutive = executiveRequests.map(r => {
                const doc = r.toObject();
                return {
                    ...doc,
                    userId: doc.executive,
                    userType: 'EXECUTIVE',
                    paymentMethod: 'Bank Transfer',
                    accountDetails: `Name: ${doc.bankDetails?.accountName}, A/C: ${doc.bankDetails?.accountNumber}, Bank: ${doc.bankDetails?.bankName}, IFSC: ${doc.bankDetails?.ifsc}`
                };
            });

            const allRequests = [...standardRequests, ...normalizedExecutive].sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            requests = allRequests.slice(skip, skip + Number(limit));
            total = (await WithdrawRequest.countDocuments(query)) + (await ExecutiveWithdrawal.countDocuments(query));
        }

        return res.status(200).json({
            success: true,
            data: {
                requests,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    } catch (error: any) {
        console.error('Error getting withdrawal requests:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get withdrawal requests',
        });
    }
};

/**
 * Approve withdrawal request
 */
export const approveWithdrawal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user!.userId;

        const request = await WithdrawRequest.findById(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found',
            });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot approve ${request.status.toLowerCase()} request`,
            });
        }

        request.status = 'Approved';
        request.processedBy = new mongoose.Types.ObjectId(adminId);
        request.processedAt = new Date();
        await request.save();

        return res.status(200).json({
            success: true,
            message: 'Withdrawal request approved successfully',
            data: request,
        });
    } catch (error: any) {
        console.error('Error approving withdrawal:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to approve withdrawal',
        });
    }
};

/**
 * Reject withdrawal request
 */
export const rejectWithdrawal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const adminId = req.user!.userId;

        const request = await WithdrawRequest.findById(id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found',
            });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot reject ${request.status.toLowerCase()} request`,
            });
        }

        request.status = 'Rejected';
        request.processedBy = new mongoose.Types.ObjectId(adminId);
        request.processedAt = new Date();
        if (remarks) request.remarks = remarks;
        await request.save();

        return res.status(200).json({
            success: true,
            message: 'Withdrawal request rejected successfully',
            data: request,
        });
    } catch (error: any) {
        console.error('Error rejecting withdrawal:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to reject withdrawal',
        });
    }
};

/**
 * Complete withdrawal request
 */
export const completeWithdrawal = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { transactionReference } = req.body;
        const adminId = req.user!.userId;

        if (!transactionReference) {
            return res.status(400).json({
                success: false,
                message: 'Transaction reference is required',
            });
        }

        const request = await WithdrawRequest.findById(id).session(session);
        if (!request) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found',
            });
        }

        if (request.status !== 'Approved') {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Only approved requests can be completed',
            });
        }

        // Debit from wallet
        const debitResult = await debitWallet(
            request.userId.toString(),
            request.userType,
            request.amount,
            `Withdrawal completed - ${transactionReference}`,
            undefined,
            session
        );

        if (!debitResult.success) {
            await session.abortTransaction();
            return res.status(400).json(debitResult);
        }

        // Update request
        request.status = 'Completed';
        request.transactionReference = transactionReference;
        request.processedBy = new mongoose.Types.ObjectId(adminId);
        request.processedAt = new Date();
        await request.save({ session });

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: 'Withdrawal completed successfully',
            data: request,
        });
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error completing withdrawal:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to complete withdrawal',
        });
    } finally {
        session.endSession();
    }
};
