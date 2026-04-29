import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

interface SellerAccessGuardProps {
    children: ReactNode;
}

export default function SellerAccessGuard({ children }: SellerAccessGuardProps) {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated || !user) {
        return <Navigate to="/seller/login" replace />;
    }

    const status = user.status;
    const depositStatus = user.securityDepositStatus;

    // 1. If Rejected -> redirect to rejection page
    if (status === "Rejected") {
        if (location.pathname !== "/seller/rejected") {
            return <Navigate to="/seller/rejected" replace />;
        }
        return <>{children}</>;
    }

    // 2. If Pending -> always redirect to verification page
    if (status === "Pending") {
        if (location.pathname !== "/seller/verification-pending") {
            return <Navigate to="/seller/verification-pending" replace />;
        }
        return <>{children}</>;
    }

    // 3. If Approved but Deposit not paid
    if (status === "Approved" && depositStatus !== "Paid" && !user.depositPaid) {
        const allowedPath = ["/seller", "/seller/", "/seller/deposit-payment", "/seller/verification-pending"].includes(location.pathname);

        if (!allowedPath) {
            return <Navigate to="/seller/deposit-payment" replace />;
        }
        return <>{children}</>;
    }

    // 4. If Approved and Paid -> Allow everything, but don't allow going back to pending/payment/rejected pages
    if (status === "Approved" && (depositStatus === "Paid" || user.depositPaid === true)) {
        if (
            location.pathname === "/seller/verification-pending" ||
            location.pathname === "/seller/deposit-payment" ||
            location.pathname === "/seller/rejected"
        ) {
            return <Navigate to="/seller" replace />;
        }
    }

    return <>{children}</>;
}
