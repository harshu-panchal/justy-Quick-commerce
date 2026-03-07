/**
 * ProductTypeBadge - Shows organic/inorganic badge with delivery info on product cards.
 */
import { getDeliveryInfo } from "../config/pincodeService";

interface ProductTypeBadgeProps {
    type: "organic" | "inorganic";
    showDeliveryText?: boolean;
    compact?: boolean;
}

export default function ProductTypeBadge({
    type,
    showDeliveryText = true,
    compact = false,
}: ProductTypeBadgeProps) {
    const info = getDeliveryInfo(type);
    const isOrganic = type === "organic";

    return (
        <div className={compact ? "mt-0.5" : "mt-1"}>
            <span
                className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${isOrganic
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
            >
                {isOrganic && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                    </svg>
                )}
                {info.badge}
            </span>
            {showDeliveryText && (
                <p className={`text-[8px] text-neutral-500 mt-0.5 leading-tight ${compact ? "" : "ml-0.5"}`}>
                    {info.deliveryText}
                </p>
            )}
        </div>
    );
}
