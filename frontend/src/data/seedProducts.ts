export const seedProducts = [
    {
        _id: "sp1",
        productName: "Fresh Tomato",
        mainImageUrl: "https://images.unsplash.com/photo-1518977676601-b53f02bad177?auto=format&fit=crop&q=80&w=400",
        category: { name: "Vegetables", slug: "vegetables" },
        variations: [{ price: 40, discPrice: 35, stock: 100, status: "Available", title: "1kg" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["fresh", "vegetable"]
    },
    {
        _id: "sp2",
        productName: "Potato 1kg",
        mainImageUrl: "https://images.unsplash.com/photo-1518977676601-b53f02bad177?auto=format&fit=crop&q=80&w=400",
        category: { name: "Vegetables", slug: "vegetables" },
        variations: [{ price: 30, discPrice: 25, stock: 200, status: "Available", title: "1kg" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["fresh", "vegetable"]
    },
    {
        _id: "sp3",
        productName: "Chocolate Cake",
        mainImageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400",
        category: { name: "Bakery", slug: "bakery" },
        variations: [{ price: 450, discPrice: 400, stock: 20, status: "Available", title: "500g" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["cake", "bakery"]
    },
    {
        _id: "sp4",
        productName: "Bluetooth Earbuds",
        mainImageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400",
        category: { name: "Electronics", slug: "electronics" },
        variations: [{ price: 1499, discPrice: 1299, stock: 50, status: "Available", title: "Standard" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["electronics", "audio"]
    },
    {
        _id: "sp5",
        productName: "Women's Kurti",
        mainImageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=400",
        category: { name: "Fashion", slug: "fashion" },
        variations: [{ price: 899, discPrice: 699, stock: 30, status: "Available", title: "M" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["fashion", "clothing"]
    },
    {
        _id: "sp6",
        productName: "Matte Lipstick",
        mainImageUrl: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?auto=format&fit=crop&q=80&w=400",
        category: { name: "Beauty", slug: "beauty" },
        variations: [{ price: 399, discPrice: 349, stock: 70, status: "Available", title: "Standard" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["beauty", "cosmetics"]
    },
    {
        _id: "sp7",
        productName: "Saffron Paan",
        mainImageUrl: "https://images.unsplash.com/photo-1626776876729-bab4b270dc6c?auto=format&fit=crop&q=80&w=400",
        category: { name: "Pan Corner", slug: "pan-corner" },
        variations: [{ price: 50, discPrice: 45, stock: 100, status: "Available", title: "Single" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["pan", "mouth-freshener"]
    },
    {
        _id: "sp8",
        productName: "Wheat Flour 5kg",
        mainImageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
        category: { name: "Grocery", slug: "grocery" },
        variations: [{ price: 245, discPrice: 230, stock: 150, status: "Available", title: "5kg" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["grocery", "atta"]
    },
    // Adding 200+ Fashion products for stress testing
    ...Array.from({ length: 210 }, (_, i) => ({
        _id: `fashion_seed_${i}`,
        productName: `Fashion Item ${i + 1}`,
        mainImageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400",
        category: { name: "Fashion", slug: "fashion" },
        variations: [{ price: 500 + (i * 10) % 2000, discPrice: 400 + (i * 10) % 2000, stock: 50, status: "Available", title: "Standard" }],
        seller: "seller_001",
        publish: true,
        status: "approved",
        tags: ["fashion", "clothing"]
    }))
];
