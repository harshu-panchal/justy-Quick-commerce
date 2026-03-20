import { useState, useEffect } from "react";
import { getQuickDeliveryProducts } from "../services/api/quickDeliveryService";
import { getStoredPincode } from "../components/PincodeSelector";
import { useAuth } from "../context/AuthContext";

export function useQuickDelivery() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [available, setAvailable] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Determine which pincode to use
    const pincode = getStoredPincode() || user?.pincode;

    useEffect(() => {
        const fetchData = async () => {
            // Note: We still call API even if pincode is missing to get global products
            try {
                setLoading(true);
                const response = await getQuickDeliveryProducts(pincode || undefined);
                if (response.success) {
                    setAvailable(response.available);
                    if (response.data) {
                        setProducts(response.data.products);
                        setSellers(response.data.sellers);
                    } else {
                        setProducts([]);
                        setSellers([]);
                    }
                } else {
                    setError(response.message || "Failed to fetch quick delivery products");
                }
            } catch (err: any) {
                console.error("Error in useQuickDelivery:", err);
                setError("Network error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [pincode]);

    return { loading, available, products, sellers, error, pincode };
}
