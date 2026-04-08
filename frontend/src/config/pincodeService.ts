/**
 * Pincode-based category availability config (mock data).
 * Categories like Grocery, Vegetables, Bakery, Pan Corner are pincode-dependent.
 * Fashion, Electronics, Beauty are universally available.
 */

// Categories that require pincode check
export const supportedPincodes: Record<string, string[]> = {
    grocery: ["462001", "462002"],
    vegetables: ["462001"],
    bakery: ["462001", "462003"],
    panCorner: ["462002"],
};

// Categories available everywhere regardless of pincode
export const universalCategories = ["fashion", "electronics", "beauty", "all"];

// Organic categories → fast delivery
export const ORGANIC_CATEGORIES = ["grocery", "vegetables", "bakery", "pan corner", "pancorner", "pan-corner"];

// Inorganic categories → standard delivery
export const INORGANIC_CATEGORIES = ["fashion", "electronics", "beauty"];

/**
 * Check if a category is available at the given pincode.
 */
export function isCategoryAvailable(categorySlug: string, pincode: string): boolean {
    const slug = categorySlug.toLowerCase().replace(/[\s-]/g, "");

    // Universal categories are always available
    if (universalCategories.includes(slug) || universalCategories.includes(categorySlug.toLowerCase())) {
        return true;
    }

    // Normalize slug for lookup
    const lookupKey = slug === "pancorner" || slug === "pan-corner" || slug === "pan corner"
        ? "panCorner"
        : slug;

    const pincodes = supportedPincodes[lookupKey];
    if (!pincodes) {
        // If category isn't in the restricted list, it's available everywhere
        return true;
    }

    return pincodes.includes(pincode);
}

/**
 * Get product type based on category name/slug.
 */
export function getCategoryType(categoryName?: string): "organic" | "inorganic" {
    if (!categoryName) return "inorganic";
    const name = categoryName.toLowerCase().replace(/[\s-]/g, "");

    for (const organic of ORGANIC_CATEGORIES) {
        if (name.includes(organic.replace(/[\s-]/g, ""))) {
            return "organic";
        }
    }

    return "inorganic";
}

/**
 * Get delivery info based on product type.
 */
export function getDeliveryInfo(type: "organic" | "inorganic") {
    if (type === "organic") {
        return {
            badge: "Organic • Fast Delivery",
            deliveryText: "Delivery in 15-20 mins",
            detailText: "Fast Delivery • 15-20 minutes",
        };
    }
    return {
        badge: "1-2 days",
        deliveryText: "Delivery in 1-2 days",
        detailText: "Standard Delivery • 1-2 days",
    };
}

/**
 * Calculate Haversine distance between two GPS coordinates (in kilometers).
 */
function haversineDistanceKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get dynamic delivery time for scheduled category products.
 *
 * PRIMARY LOGIC: Uses GPS coordinates + seller's serviceRadiusKm.
 *   - distance <= serviceRadius → "local" delivery time
 *   - distance >  serviceRadius → "regional" delivery time
 *
 * FALLBACK: If any coordinates are missing, uses city-segment matching.
 *
 * Returns the exact text the seller entered at registration — never hardcoded.
 *
 * @param sellerDeliveryTime - { regional?: string, local?: string } from seller record
 * @param sellerCity         - seller's city string (used in fallback)
 * @param userCity           - user's city string (used in fallback)
 * @param userLat            - user's GPS latitude
 * @param userLng            - user's GPS longitude
 * @param sellerLocation     - seller's GeoJSON location { type: 'Point', coordinates: [lng, lat] }
 * @param sellerServiceRadius - seller's service radius in km (default 20 km)
 * @param productDeliveryTime - optional product-specific delivery times
 */
export function getScheduledDeliveryText(
    sellerDeliveryTime: { regional?: string; local?: string } | undefined,
    sellerCity: string | undefined,
    userCity: string | undefined,
    userLat?: number | null,
    userLng?: number | null,
    sellerLocation?: { type: string; coordinates: [number, number] } | null,
    sellerServiceRadius?: number | null,
    productDeliveryTime?: { regionalTime?: string; localTime?: string } | null
): string {
    const effectiveRegional = productDeliveryTime?.regionalTime || sellerDeliveryTime?.regional;
    const effectiveLocal = productDeliveryTime?.localTime || sellerDeliveryTime?.local;

    if (!effectiveRegional && !effectiveLocal) {
        return "Delivery time will be updated";
    }

    const DEFAULT_RADIUS_KM = 20;
    let isLocal = false;

    // ── PRIMARY: GPS distance check ──────────────────────────────────────────
    if (
        userLat != null && userLng != null &&
        !isNaN(userLat) && !isNaN(userLng) &&
        sellerLocation?.coordinates?.length === 2
    ) {
        const [sellerLng, sellerLat] = sellerLocation.coordinates; // GeoJSON: [lng, lat]
        const radius = (sellerServiceRadius != null && sellerServiceRadius > 0)
            ? sellerServiceRadius
            : DEFAULT_RADIUS_KM;
        const distance = haversineDistanceKm(userLat, userLng, sellerLat, sellerLng);
        isLocal = distance <= radius;
    }
    // ── FALLBACK: city-segment comparison ───────────────────────────────────
    else if (sellerCity && userCity) {
        const sellerSegments = sellerCity.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        const userSegments = userCity.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        isLocal = userSegments.some(u => sellerSegments.includes(u)) ||
                  sellerSegments.some(s => userSegments.includes(s));
    }

    // ── Return the seller's or product's own delivery time strings (never hardcoded) ─────
    if (isLocal && effectiveLocal) {
        return `Delivery in ${effectiveLocal}`;
    }
    if (effectiveRegional) {
        return `Delivery in ${effectiveRegional}`;
    }
    return "Delivery time will be updated";
}
