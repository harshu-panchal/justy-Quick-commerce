import api from '../config';

export const getDeliveryEquipmentOrders = async () => {
    const response = await api.get('/delivery/equipment-deliveries');
    return response.data;
};

export const completeEquipmentDelivery = async (orderId: string) => {
    const response = await api.patch(`/delivery/equipment-deliveries/${orderId}/delivered`, {});
    return response.data;
};
