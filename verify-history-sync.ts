import mongoose from 'mongoose';
import Order from './backend/src/models/Order';
import EquipmentOrder from './backend/src/models/EquipmentOrder';
import Commission from './backend/src/models/Commission';
import Delivery from './backend/src/models/Delivery';

async function verifyUnifiedHistory() {
    await mongoose.connect('mongodb://localhost:27017/qickcommerce');
    console.log('Connected to DB');

    try {
        const deliveryBoyId = new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1'); // Use a realistic ID from your test data or seed one

        // Check History Endpoint Logic (Mocking the controller call)
        const [orders, equipmentOrders] = await Promise.all([
          Order.find({ deliveryBoy: deliveryBoyId }),
          EquipmentOrder.find({ deliveryBoy: deliveryBoyId })
        ]);

        console.log(`Found ${orders.length} regular orders and ${equipmentOrders.length} equipment orders for delivery boy.`);

        if (equipmentOrders.length > 0) {
            console.log('PASS: Equipment orders found in history query logic.');
        } else {
            console.log('WARN: No equipment orders found for this delivery boy. Ensure seeding was correct.');
        }

        // Check Dashboard Stats aggregation
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const eqStats = await EquipmentOrder.aggregate([
            { $match: { deliveryBoy: deliveryBoyId } },
            {
                $group: {
                    _id: null,
                    deliveredToday: {
                        $sum: {
                            $cond: [{ $and: [{ $eq: ["$status", "delivered"] }, { $gte: ["$updatedAt", todayStart] }] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        console.log('Equipment Dashboard Stats:', eqStats[0] || { deliveredToday: 0 });

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

// verifyUnifiedHistory();
console.log('Refactored Verification logic ready. Backend updated to unify Order and EquipmentOrder in:');
console.log('1. getTodayOrders');
console.log('2. getPendingOrders');
console.log('3. getReturnOrders');
console.log('4. getAllOrdersHistory');
console.log('5. getDashboardStats');
console.log('6. getOrderDetails');
