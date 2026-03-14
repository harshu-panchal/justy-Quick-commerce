import { Router } from 'express';
import { authenticate, requireUserType } from '../middleware/auth';
import {
    getBalance,
    getTransactions,
    requestWithdrawal,
    getWithdrawals,
    getCommissions,
    getWalletHistory,
} from '../modules/seller/controllers/sellerWalletController';

const router = Router();

// All routes require seller authentication
router.use(authenticate, requireUserType('Seller'));

// Wallet balance
router.get('/balance', getBalance);

// Wallet transactions
router.get('/transactions', getTransactions);

// Wallet history (including penalties)
router.get('/history', getWalletHistory);

// Withdrawal requests
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getWithdrawals);

// Commission earnings
router.get('/commissions', getCommissions);

export default router;
