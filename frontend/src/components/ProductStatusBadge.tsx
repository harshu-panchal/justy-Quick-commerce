/**
 * ProductStatusBadge - Shows approval status on seller product list.
 */

interface ProductStatusBadgeProps {
    status: string;
}

const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    inactive: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
    pending: "Pending Approval",
    active: "Active",
    approved: "Approved",
    rejected: "Rejected",
    inactive: "Inactive",
};

export default function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
    const lowerStatus = status.toLowerCase();
    const style = statusStyles[lowerStatus] || statusStyles.pending;
    const label = statusLabels[lowerStatus] || statusLabels.pending;

    return (
        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}>
            {label}
        </span>
    );
}
