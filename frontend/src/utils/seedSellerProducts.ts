import { seedProducts } from '../data/seedProducts';

export const seedSellerProducts = () => {
    // Only run if products haven't been seeded yet
    const isSeeded = localStorage.getItem("is_products_seeded");
    if (isSeeded) return;

    console.log("Seeding products to localStorage...");
    const existing = JSON.parse(localStorage.getItem("products") || "[]");

    // Check if some seeds already exist in current products to avoid duplicates if partially existed
    const existingIds = new Set(existing.map((p: any) => p._id || p.id));
    const newProducts = seedProducts.filter(p => !existingIds.has(p._id));

    const updated = [...existing, ...newProducts];
    localStorage.setItem("products", JSON.stringify(updated));
    localStorage.setItem("is_products_seeded", "true");

    console.log(`Seeded ${newProducts.length} new products.`);
};
