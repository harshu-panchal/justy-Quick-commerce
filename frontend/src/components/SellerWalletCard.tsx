/**
 * SellerWalletCard - Compact wallet summary widget for seller dashboard.
 */
import { motion } from "framer-motion";

interface SellerWalletCardProps {
    walletBalance?: number;
    totalPenalties?: number;
    availableBalance?: number;
}

export default function SellerWalletCard({
    walletBalance = 1000,
    totalPenalties = 0,
    availableBalance,
}: SellerWalletCardProps) {
    const available = availableBalance ?? walletBalance - totalPenalties;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md"
        >
            <h3 className="text-sm font-medium opacity-90 mb-3">Wallet Overview</h3>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <p className="text-[10px] opacity-75 mb-0.5">Wallet Balance</p>
                    <p className="text-lg font-bold">₹{walletBalance.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-[10px] opacity-75 mb-0.5">Penalties</p>
                    <p className="text-lg font-bold">₹{totalPenalties.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-[10px] opacity-75 mb-0.5">Available</p>
                    <p className="text-lg font-bold">₹{available.toFixed(2)}</p>
                </div>
            </div>
        </motion.div>
    );
}
