import ProductCard from './ProductCard';
import { Product } from '../../../types/domain';

const comboProducts: Product[] = [
    {
        id: "combo-1",
        _id: "combo-1",
        name: "Shirt + Pant Combo",
        productName: "Shirt + Pant Combo",
        price: 1299,
        mrp: 1999,
        imageUrl: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=200&auto=format&fit=crop",
        pack: "1 Set",
        categoryId: "fashion",
        category: { id: "fashion", name: "Fashion" },
        rating: 4.5,
        reviews: 120,
        isAvailable: true
    },
    {
        id: "combo-2",
        _id: "combo-2",
        name: "Cake + Ice Cream Combo",
        productName: "Cake + Ice Cream Combo",
        price: 499,
        mrp: 699,
        imageUrl: "https://images.unsplash.com/photo-1558961312-50345c0f13a2?q=80&w=200&auto=format&fit=crop",
        pack: "1 Combo",
        categoryId: "bakery",
        category: { id: "bakery", name: "Bakery" },
        rating: 4.8,
        reviews: 85,
        isAvailable: true
    },
    {
        id: "combo-3",
        _id: "combo-3",
        name: "Burger + Coke Combo",
        productName: "Burger + Coke Combo",
        price: 199,
        mrp: 299,
        imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=200&auto=format&fit=crop",
        pack: "1 Meal",
        categoryId: "food",
        category: { id: "food", name: "Food" },
        rating: 4.2,
        reviews: 210,
        isAvailable: true
    }
];

interface ComboOfferSectionProps {
    categoryId?: string;
    categoryName?: string;
    currentProductId?: string;
}

export default function ComboOfferSection({ categoryId, categoryName, currentProductId }: ComboOfferSectionProps) {
    const filteredCombos = comboProducts.filter((item) => {
        // Exclude the current product if it happens to be in the combo list
        if (item.id === currentProductId || item._id === currentProductId) return false;

        // Match by categoryId (slug) or categoryName
        const matchesId = categoryId && item.categoryId === categoryId;
        const matchesName = categoryName && item.category?.name?.toLowerCase() === categoryName.toLowerCase();

        return matchesId || matchesName;
    });

    if (filteredCombos.length === 0) return null;

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3 px-1">
                🔥 Combo Offers
            </h3>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-1">
                {filteredCombos.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-40">
                        <ProductCard
                            product={product}
                            showBadge={true}
                            compact={true}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
