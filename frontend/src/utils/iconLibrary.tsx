import React from 'react';

export interface IconDef {
    name: string;
    label: string;
    tags: string[];
    svg: React.ReactNode;
}

export const ICON_LIBRARY: IconDef[] = [
    // --- GROCERY & FOOD ---
    {
        name: 'grocery-basket',
        label: 'Grocery Basket',
        tags: ['grocery', 'food', 'basket', 'buy', 'shop', 'market', 'vegetable'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.29 2.29a1 1 0 0 0 .7 1.71h14M17 13v1" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="17" cy="20" r="1" />
            </svg>
        )
    },
    {
        name: 'fast-food',
        label: 'Fast Food',
        tags: ['fast', 'food', 'burger', 'drink', 'meal', 'lunch', 'dinner'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5l2.5-2.5h-5L12 5zm-6 4c0-2 2-3 6-3s6 1 6 3v2H6V9zm0 4h12v1.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 14.5V13zm0-2h12v1H6v-1z" />
                <path d="M7 21h10" strokeLinecap="round" />
                <path d="M12 5v4" strokeLinecap="round" />
            </svg>
        )
    },
    {
        name: 'vegetables',
        label: 'Vegetables',
        tags: ['vegetable', 'tomato', 'food', 'grocery', 'farm', 'fresh', 'healthy'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21c4.4 0 8-3.6 8-8 0-4.4-3.6-8-8-8-4.4 0-8 3.6-8 8 0 4.4 3.6 8 8 8z" />
                <path d="M12 5c-1.5 0-3 1.5-3 3" />
                <path d="M12 5c1.5 0 3 1.5 3 3" />
                <path d="M12 2v3" />
            </svg>
        )
    },
    {
        name: 'fruits',
        label: 'Fruits',
        tags: ['fruit', 'apple', 'healthy', 'food', 'grocery', 'fresh', 'juice'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
                <path d="M12 4c0-2 2-3 2-3" />
                <path d="M12 4c-1.5-1-4-1-4-1" />
            </svg>
        )
    },
    {
        name: 'bakery',
        label: 'Bakery',
        tags: ['bakery', 'bread', 'cake', 'food', 'breakfast', 'toast'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.5V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6.5" />
                <path d="M20 20H4a2 2 0 0 1-2-2v-3.5h20V18a2 2 0 0 1-2 2z" />
                <path d="M8 8v2" />
                <path d="M12 8v2" />
                <path d="M16 8v2" />
            </svg>
        )
    },
    {
        name: 'coffee-tea',
        label: 'Tea & Coffee',
        tags: ['coffee', 'tea', 'drink', 'beverage', 'cup', 'mug', 'cafe', 'breakfast'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
        )
    },
    {
        name: 'meat-fish',
        label: 'Meat & Fish',
        tags: ['meat', 'fish', 'seafood', 'non-veg', 'protein', 'chicken'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 7c0-3.3-2.7-6-6-6-1.7 0-3.2.7-4.2 1.8-.6.7-1.8 1.2-1.8 3.2 0 3.3 2.7 6 6 6 1.7 0 3.2-.7 4.2-1.8.6-.7 1.8-1.2 1.8-3.2z" />
                <path d="M6 12l-3 3 3 3" />
                <path d="M18 12c-3.3 0-6 2.7-6 6 0 2.2 1.8 4 4 4s4-1.8 4-4-2.7-6-6-6z" />
                <circle cx="18" cy="18" r="1.5" />
            </svg>
        )
    },
    {
        name: 'ice-cream',
        label: 'Ice Cream',
        tags: ['ice', 'cream', 'dessert', 'summer', 'sweet', 'cone', 'cold'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 11c0-4 2.5-6 5-6s5 2 5 6v1H7v-1z" />
                <path d="M12 22l-5-10h10l-5 10z" />
            </svg>
        )
    },
    {
        name: 'pizza',
        label: 'Pizza',
        tags: ['pizza', 'fast', 'food', 'italian', 'dinner', 'snack', 'slice'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 22h20L12 2z" />
                <path d="M12 2v20" />
                <circle cx="12" cy="10" r="1.5" />
                <circle cx="9" cy="16" r="1.5" />
                <circle cx="15" cy="16" r="1.5" />
            </svg>
        )
    },

    // --- FASHION ---
    {
        name: 'fashion',
        label: 'Fashion',
        tags: ['fashion', 'clothes', 'style', 'dress', 'apparel', 'wear'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
            </svg>
        )
    },
    {
        name: 'mens-wear',
        label: 'Mens Wear',
        tags: ['men', 'wear', 'shirt', 'tshirt', 'clothes', 'fashion', 'boy'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6l3-4h12l3 4v16H3V6z" />
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <path d="M12 6v14" />
            </svg>
        )
    },
    {
        name: 'womens-wear',
        label: 'Womens Wear',
        tags: ['women', 'wear', 'dress', 'frock', 'clothes', 'fashion', 'girl', 'lady'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l-7 4v16h14V6l-7-4z" />
                <path d="M12 7v15" />
                <path d="M8 12h8" />
            </svg>
        )
    },
    {
        name: 'footwear',
        label: 'Footwear',
        tags: ['footwear', 'shoes', 'sneakers', 'boots', 'sandals', 'running', 'sports'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16v-5a5 5 0 0 1 5-5h6a3 3 0 0 1 3 3v2" />
                <path d="M4 16h17a2 2 0 0 1 0 4H5a1 1 0 0 1-1-1z" />
                <path d="M13 11l4 5" />
            </svg>
        )
    },
    {
        name: 'watches',
        label: 'Watches',
        tags: ['watch', 'time', 'wrist', 'accessories', 'luxury', 'fashion'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7" />
                <path d="M12 9v3l1.5 1.5" />
                <path d="M12 5V3m0 18v-2" />
                <path d="M16.24 16.24L19.07 19.07M4.93 4.93L7.76 7.76" />
            </svg>
        )
    },
    {
        name: 'jewelry',
        label: 'Jewelry',
        tags: ['jewelry', 'ring', 'necklace', 'diamond', 'gold', 'luxury', 'wedding'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 13L2 9z" />
                <path d="M11 3v6" />
                <path d="M13 3v6" />
                <path d="M2 9h20" />
            </svg>
        )
    },
    {
        name: 'bags',
        label: 'Bags',
        tags: ['bag', 'handbag', 'purse', 'travel', 'fashion', 'accessories'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="8" width="16" height="14" rx="2" />
                <path d="M8 8V6a4 4 0 0 1 8 0v2" />
            </svg>
        )
    },

    // --- ELECTRONICS ---
    {
        name: 'electronics',
        label: 'Electronics',
        tags: ['electronics', 'gadget', 'tech', 'device', 'plug', 'power', 'socket'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="4" />
                <circle cx="12" cy="12" r="2" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
            </svg>
        )
    },
    {
        name: 'mobiles',
        label: 'Mobiles',
        tags: ['mobile', 'phone', 'smartphone', 'call', 'device', 'tech'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="3" />
                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
            </svg>
        )
    },
    {
        name: 'laptops',
        label: 'Laptops',
        tags: ['laptop', 'computer', 'pc', 'macbook', 'work', 'tech'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <path d="M2 20h20" />
                <path d="M22 20l-1-4H3l-1 4" />
            </svg>
        )
    },
    {
        name: 'headphones',
        label: 'Headphones',
        tags: ['headphone', 'audio', 'music', 'sound', 'ears', 'tech', 'gadget'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14v4a2 2 0 0 0 2 2h2v-8H6a2 2 0 0 0-2 2z" />
                <path d="M16 12h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2v-8z" />
                <path d="M6 12V7a6 6 0 1 1 12 0v5" />
            </svg>
        )
    },
    {
        name: 'camera',
        label: 'Cameras',
        tags: ['camera', 'photo', 'video', 'lens', 'photography', 'shoot'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                <circle cx="12" cy="14" r="4" />
                <line x1="17" y1="10" x2="17.01" y2="10" strokeWidth="2" />
            </svg>
        )
    },

    // --- HOME & LIVING ---
    {
        name: 'home',
        label: 'Home & Living',
        tags: ['home', 'house', 'furniture', 'decor', 'living', 'room'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5" />
                <path d="M19 10v11a1 1 0 0 1-1 1h-4v-6h-4v6H6a1 1 0 0 1-1-1V10" />
            </svg>
        )
    },
    {
        name: 'furniture',
        label: 'Furniture',
        tags: ['furniture', 'sofa', 'chair', 'table', 'wood', 'home', 'decor'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 10h12" />
                <path d="M6 10v6a3 3 0 0 0 6 0v-6" />
                <path d="M18 10v6a3 3 0 0 1-6 0" />
                <path d="M4 20h16" />
            </svg>
        )
    },
    {
        name: 'clean',
        label: 'Cleaning',
        tags: ['clean', 'wash', 'soap', 'hygiene', 'sweep', 'vacuum', 'brush', 'spray'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 11a4 4 0 1 1-6.8-4.2l5-9 1.7 1z" />
                <path d="M5 19h14M8 19v-4m8 4v-4" />
            </svg>
        )
    },
    {
        name: 'kitchen',
        label: 'Kitchen',
        tags: ['kitchen', 'cook', 'pot', 'pan', 'utensils', 'chef', 'food'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h20" />
                <path d="M20 12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6" />
                <path d="M5 8v4" />
                <path d="M12 5v7" />
                <path d="M19 8v4" />
            </svg>
        )
    },

    // --- OTHERS ---
    {
        name: 'beauty',
        label: 'Beauty',
        tags: ['beauty', 'makeup', 'lipstick', 'salon', 'care', 'cosmetics', 'face'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4L6 8V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V8L16 4H8Z" />
                <path d="M8 4H16" />
                <path d="M10 12L12 14L14 12" />
                <path d="M9 8H15" />
            </svg>
        )
    },
    {
        name: 'medicine',
        label: 'Medicine',
        tags: ['medicine', 'health', 'doctor', 'pill', 'hospital', 'care', 'pharmacy'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
            </svg>
        )
    },
    {
        name: 'baby',
        label: 'Baby Care',
        tags: ['baby', 'child', 'kid', 'toy', 'diaper', 'care', 'infant', 'pram'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="16" cy="18" r="2" />
                <circle cx="9" cy="18" r="2" />
                <path d="M19 16V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10" />
                <path d="M5 14h14" />
                <path d="M7 6h10" />
                <path d="M22 6h-3" />
            </svg>
        )
    },
    {
        name: 'pet',
        label: 'Pet Care',
        tags: ['pet', 'dog', 'cat', 'animal', 'food', 'care', 'vet', 'paw'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 14c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z" />
                <path d="M7 6.5c0 1.4-1.1 2.5-2.5 2.5S2 7.9 2 6.5 3.1 4 4.5 4 7 5.1 7 6.5z" />
                <path d="M12.5 3c0 1.4-1.1 2.5-2.5 2.5S7.5 4.4 7.5 3 8.6 0.5 10 0.5 12.5 1.6 12.5 3z" />
                <path d="M17 6.5c0 1.4-1.1 2.5-2.5 2.5S12 7.9 12 6.5 13.1 4 14.5 4 17 5.1 17 6.5z" />
                <path d="M22 6.5c0 1.4-1.1 2.5-2.5 2.5S17 7.9 17 6.5 18.1 4 19.5 4 22 5.1 22 6.5z" />
            </svg>
        )
    },
    {
        name: 'sports',
        label: 'Sports',
        tags: ['sports', 'game', 'play', 'fitness', 'gym', 'active', 'ball'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
            </svg>
        )
    },
    {
        name: 'fitness',
        label: 'Fitness',
        tags: ['fitness', 'gym', 'dumbbell', 'weight', 'workout', 'muscle', 'health'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4h12" />
                <path d="M6 20h12" />
                <path d="M9 4v16" />
                <path d="M15 4v16" />
            </svg>
        )
    },
    {
        name: 'books',
        label: 'Books',
        tags: ['book', 'read', 'study', 'learn', 'education', 'library', 'paper'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        )
    },
    {
        name: 'toys',
        label: 'Toys',
        tags: ['toys', 'game', 'puzzle', 'kid', 'child', 'play', 'block'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2" />
                <circle cx="12" cy="12" r="3" />
                <path d="M6 6l4 4" />
                <path d="M18 6l-4 4" />
                <path d="M6 18l4-4" />
                <path d="M18 18l-4-4" />
            </svg>
        )
    },
    {
        name: 'automotive',
        label: 'Automotive',
        tags: ['auto', 'car', 'vehicle', 'drive', 'transport', 'bike', 'motor'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 16H9m10 0h3v-3.15M17 16h6M3 16h6m-9 0v-5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v5" style={{ stroke: 'currentColor' }} />
                <circle cx="6" cy="16" r="2" />
                <circle cx="18" cy="16" r="2" />
            </svg>
        )
    },
    {
        name: 'wedding',
        label: 'Wedding',
        tags: ['wedding', 'marriage', 'love', 'couple', 'gift', 'celebrate', 'event'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        )
    },
    {
        name: 'party',
        label: 'Party Needs',
        tags: ['party', 'celebrate', 'balloon', 'confetti', 'event', 'birthday', 'gift'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="5" />
                <line x1="12" y1="15" x2="12" y2="22" />
                <path d="M9 18s1-1 3-1 3 1 3 1" />
            </svg>
        )
    },
    {
        name: 'winter',
        label: 'Winter',
        tags: ['winter', 'snow', 'cold', 'weather', 'ice', 'season'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
            </svg>
        )
    },
    // --- NEWLY ADDED FOR HEADER ---
    {
        name: 'grid',
        label: 'Grid',
        tags: ['grid', 'all', 'layout'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        )
    },
    {
        name: 'shirt',
        label: 'Shirt',
        tags: ['fashion', 'shirt', 'clothes'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
            </svg>
        )
    },
    {
        name: 'shopping-basket',
        label: 'Shopping Basket',
        tags: ['grocery', 'shopping', 'basket'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
        )
    },
    {
        name: 'sparkles',
        label: 'Sparkles',
        tags: ['beauty', 'sparkles', 'magic'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
            </svg>
        )
    },
    {
        name: 'cpu',
        label: 'CPU',
        tags: ['electronics', 'cpu', 'chip'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9 9h6v6H9z" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
            </svg>
        )
    },
    {
        name: 'store',
        label: 'Store',
        tags: ['store', 'shop', 'pan corner'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9 12 3l9 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 22V12h6v10" />
            </svg>
        )
    },
    {
        name: 'cake',
        label: 'Cake',
        tags: ['bakery', 'cake', 'food'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" /><path d="M2 21h20" /><path d="M7 8v3" /><path d="M12 8V5" /><path d="M17 8v3" /><path d="M7 4h.01" /><path d="M17 4h.01" /><path d="M12 2h.01" />
            </svg>
        )
    },
    {
        name: 'carrot',
        label: 'Carrot',
        tags: ['vegetables', 'carrot', 'food'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7Z" /><path d="M8.64 14l-2.05-2.04" /><path d="M11.5 16.86l-2.05-2.04" /><path d="M18 5.74c-.5.5-5.6 1.3-5.6 1.3" /><path d="M18.26 5.74s.8-5.1 1.3-5.6" /><path d="M18.26 5.74s5.1.8 5.6 1.3" />
            </svg>
        )
    },
    {
        name: 'paw',
        label: 'Pet Care',
        tags: ['pet', 'animal', 'dog', 'cat', 'paw'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5a2 2 0 1 0-2-2" /><path d="M15 5a2 2 0 1 1 2-2" /><path d="M7 10a2 2 0 1 0-2-2" /><path d="M19 10a2 2 0 1 1 2-2" /><path d="M12 12c-3 0-4.5 1.5-4.5 4.5s1.5 4.5 4.5 4.5 4.5-1.5 4.5-4.5-1.5-4.5-4.5-4.5z" />
            </svg>
        )
    },
    {
        name: 'sprout',
        label: 'Garden',
        tags: ['garden', 'plant', 'nature', 'grow'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 20h10" /><path d="M10 20c5.5-2.5 8-6.5 8-6.5s-2.8 0-5 2c-2.2 2-3 4.5-3 4.5z" /><path d="M14 20c-5.5-2.5-8-6.5-8-6.5s2.8 0 5 2c2.2 2 3 4.5 3 4.5z" /><path d="M12 20v-9" /><path d="M12 11c0-4 3-7 3-7s-3 3-3 7z" />
            </svg>
        )
    },
    {
        name: 'wrench',
        label: 'Tools',
        tags: ['tools', 'hardware', 'repair', 'fix'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        )
    },
    {
        name: 'gamepad',
        label: 'Gaming',
        tags: ['gaming', 'game', 'play', 'fun', 'controller'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><rect x="15" y="13" width="2" height="2" rx="1" /><rect x="17" y="11" width="2" height="2" rx="1" /><path d="M18 6H6a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4z" />
            </svg>
        )
    },
    {
        name: 'plane',
        label: 'Travel',
        tags: ['travel', 'flight', 'plane', 'holiday', 'trip'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5s-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-1.1-.3-2.3.2-2.8 1.1-.5.9-.2 2.1.8 2.5l7.5 3-3.1 3.1-3.2-.8c-.9-.2-1.9.1-2.4.9-.5.8-.4 1.9.3 2.5l3.2 2.5a1.5 1.5 0 0 0 2.1 0l2.5-3.2c.6.7 1.7.8 2.5.3.8-.5 1.1-1.5.9-2.4l-.8-3.2 3.1-3.1 3 7.5c.4 1 1.6 1.3 2.5.8.9-.5 1.4-1.7 1.1-2.8z" />
            </svg>
        )
    },
    {
        name: 'music-note',
        label: 'Music',
        tags: ['music', 'audio', 'sound', 'song'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
        )
    },
    {
        name: 'briefcase',
        label: 'Office',
        tags: ['office', 'work', 'business', 'bag', 'job'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
        )
    },
    {
        name: 'tent',
        label: 'Outdoor',
        tags: ['outdoor', 'camping', 'tent', 'nature', 'adventure'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m19 20-7-14-7 14h14z" /><path d="M12 14v6" /><path d="m7 20 5-5 5 5" />
            </svg>
        )
    },
    {
        name: 'battery',
        label: 'Tech Power',
        tags: ['battery', 'power', 'tech', 'energy', 'charge'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="16" height="10" rx="2" /><line x1="22" y1="11" x2="22" y2="13" />
            </svg>
        )
    },
    {
        name: 'lamp',
        label: 'Home Light',
        tags: ['home', 'light', 'lamp', 'decor', 'bedroom'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 22h8" /><path d="M12 11v11" /><path d="M12 7a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z" /><path d="m6 7 1.1-4.4a1 1 0 0 1 .9-.6h8a1 1 0 0 1 .9.6L18 7" />
            </svg>
        )
    },
    {
        name: 'utensils',
        label: 'Dining',
        tags: ['dining', 'food', 'restaurant', 'eat', 'fork', 'knife'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
        )
    },
    {
        name: 'sun',
        label: 'Summer',
        tags: ['summer', 'sun', 'weather', 'hot', 'day'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.3 17.7-1.4 1.4" /><path d="m19.1 4.9-1.4 1.4" />
            </svg>
        )
    },
    {
        name: 'moon',
        label: 'Night',
        tags: ['night', 'moon', 'sleep', 'weather', 'dark'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
        )
    },
    {
        name: 'cloud',
        label: 'Weather',
        tags: ['weather', 'cloud', 'nature', 'sky'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19x0a4.5 4.5 0 0 1-1.45-8.76 7 7 0 1 1 13.5 1.5 4.5 4.5 0 0 1 1.45 8.76Z" />
            </svg>
        )
    },
    {
        name: 'umbrella',
        label: 'Rain',
        tags: ['rain', 'weather', 'protection', 'umbrella'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10a10 10 0 0 0-20 0" /><path d="M12 10v10a2 2 0 0 1-4 0" /><path d="M12 2v1" />
            </svg>
        )
    },
    {
        name: 'flag',
        label: 'Event',
        tags: ['event', 'flag', 'country', 'mark'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
            </svg>
        )
    },
    {
        name: 'map',
        label: 'Travel Location',
        tags: ['travel', 'location', 'map', 'navigation'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20 3 7" /><line x1="9" y1="4" x2="9" y2="17" /><line x1="15" y1="7" x2="15" y2="20" />
            </svg>
        )
    },
    {
        name: 'key',
        label: 'Security Access',
        tags: ['security', 'access', 'key', 'privacy'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 2-2 2m-7.61 7a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3L15.5 7.5z" />
            </svg>
        )
    },
    {
        name: 'lock',
        label: 'Security Privacy',
        tags: ['security', 'privacy', 'lock', 'safe'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        )
    },
    {
        name: 'bell',
        label: 'Notification',
        tags: ['notification', 'alert', 'bell', 'reminder'],
        svg: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
        )
    }
];

export const getIconByName = (name: string): React.ReactNode => {
    const found = ICON_LIBRARY.find(icon => icon.name === name);
    return found ? found.svg : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
    );
};
