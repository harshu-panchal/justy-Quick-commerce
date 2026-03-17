import HeaderCategory from '../models/HeaderCategory';

const DEFAULT_CATEGORIES = [
    {
        name: 'Wedding',
        iconLibrary: 'Custom', // Using 'Custom' to indicate it maps to internal SVGs
        iconName: 'wedding',
        slug: 'wedding',
        deliveryType: 'scheduled',
        status: 'Published',
        order: 1
    },
    {
        name: 'Winter',
        iconLibrary: 'Custom',
        iconName: 'winter',
        slug: 'winter',
        deliveryType: 'scheduled',
        status: 'Published',
        order: 2
    },
    {
        name: 'Electronics',
        iconLibrary: 'Custom',
        iconName: 'electronics',
        slug: 'electronics',
        deliveryType: 'scheduled',
        status: 'Published',
        order: 3
    },
    {
        name: 'Beauty',
        iconLibrary: 'Custom',
        iconName: 'beauty',
        slug: 'beauty',
        deliveryType: 'scheduled',
        status: 'Published',
        order: 4
    },
    {
        name: 'Grocery',
        iconLibrary: 'Custom',
        iconName: 'grocery',
        slug: 'grocery',
        deliveryType: 'quick',
        status: 'Published',
        order: 5
    },
    {
        name: 'Fashion',
        iconLibrary: 'Custom',
        iconName: 'fashion',
        slug: 'fashion',
        deliveryType: 'scheduled',
        status: 'Published',
        order: 6
    },
    {
        name: 'Sports',
        iconLibrary: 'Custom',
        iconName: 'sports',
        slug: 'sports',
        deliveryType: 'scheduled',
        status: 'Published',
        order: 7
    }
];

export async function seedHeaderCategories() {
    try {
        const count = await HeaderCategory.countDocuments();
        
        if (count === 0) {
            await HeaderCategory.insertMany(DEFAULT_CATEGORIES);
            console.log('Default header categories seeded successfully.');
        } else {
            // Update existing categories' deliveryType based on defaults
            for (const cat of DEFAULT_CATEGORIES) {
                await HeaderCategory.updateOne(
                    { slug: cat.slug },
                    { $set: { deliveryType: cat.deliveryType } }
                );
            }
            console.log('Header categories delivery types synchronized.');
        }
    } catch (error) {
        console.error('Error seeding header categories:', error);
    }
}
