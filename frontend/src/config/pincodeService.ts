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
        badge: "Inorganic",
        deliveryText: "Delivery in 1-2 days",
        detailText: "Standard Delivery • 1-2 days",
    };
}
