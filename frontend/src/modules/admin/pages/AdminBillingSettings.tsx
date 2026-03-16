import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { getAppSettings, updateAppSettings, AppSettings } from '../../../services/api/admin/adminSettingsService';
import { motion } from 'framer-motion';

export default function AdminBillingSettings() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    // Form State
    const [platformFee, setPlatformFee] = useState<number>(0);
    const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(0);
    const [deliveryCharges, setDeliveryCharges] = useState<number>(0);

    // Distance Based Config
    const [isDistanceBased, setIsDistanceBased] = useState(false);
    const [baseCharge, setBaseCharge] = useState<number>(0);
    const [baseDistance, setBaseDistance] = useState<number>(0);
    const [kmRate, setKmRate] = useState<number>(0);
    const [deliveryBoyKmRate, setDeliveryBoyKmRate] = useState<number>(0);
    const [googleMapsKey, setGoogleMapsKey] = useState<string>('');

    // Referral Settings State
    const [referralEnabled, setReferralEnabled] = useState(false);
    const [rewardAmount, setRewardAmount] = useState<number>(0);
    const [rewardType, setRewardType] = useState<'Wallet' | 'Points'>('Wallet');
    const [minOrderValue, setMinOrderValue] = useState<number>(0);
    const [maxReferrals, setMaxReferrals] = useState<number>(10);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await getAppSettings();
            if (response && response.success && response.data) {
                const data = response.data;
                setSettings(data);

                // Initialize State
                setPlatformFee(data.platformFee || 0);
                setFreeDeliveryThreshold(data.freeDeliveryThreshold || 0);
                setDeliveryCharges(data.deliveryCharges || 0);

                if (data.deliveryConfig) {
                    setIsDistanceBased(data.deliveryConfig.isDistanceBased || false);
                    setBaseCharge(data.deliveryConfig.baseCharge || 0);
                    setBaseDistance(data.deliveryConfig.baseDistance || 0);
                    setKmRate(data.deliveryConfig.kmRate || 0);
                    setDeliveryBoyKmRate(data.deliveryConfig.deliveryBoyKmRate || 0);
                    setGoogleMapsKey(data.deliveryConfig.googleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
                } else {
                    setGoogleMapsKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
                }

                if (data.referralSettings) {
                    setReferralEnabled(data.referralSettings.enabled ?? false);
                    setRewardAmount(data.referralSettings.rewardAmount ?? 0);
                    setRewardType(data.referralSettings.rewardType ?? 'Wallet');
                    setMinOrderValue(data.referralSettings.minOrderValue ?? 0);
                    setMaxReferrals(data.referralSettings.maxReferralsPerUser ?? 10);
                }
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to fetch settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const updatePayload: any = {
                platformFee,
                freeDeliveryThreshold,
                deliveryCharges,
                deliveryConfig: {
                    isDistanceBased,
                    baseCharge,
                    baseDistance,
                    kmRate,
                    deliveryBoyKmRate,
                    googleMapsKey
                },
                referralSettings: {
                    enabled: referralEnabled,
                    rewardAmount,
                    rewardType,
                    minOrderValue,
                    maxReferralsPerUser: maxReferrals
                }
            };

            const response = await updateAppSettings(updatePayload);
            if (response.success && response.data) {
                const data = response.data;
                showToast('Billing settings updated successfully');
                setSettings(data);
                
                // Sync all states to be sure
                setPlatformFee(data.platformFee || 0);
                setFreeDeliveryThreshold(data.freeDeliveryThreshold || 0);
                setDeliveryCharges(data.deliveryCharges || 0);

                if (data.deliveryConfig) {
                    setIsDistanceBased(data.deliveryConfig.isDistanceBased || false);
                    setBaseCharge(data.deliveryConfig.baseCharge || 0);
                    setBaseDistance(data.deliveryConfig.baseDistance || 0);
                    setKmRate(data.deliveryConfig.kmRate || 0);
                    setDeliveryBoyKmRate(data.deliveryConfig.deliveryBoyKmRate || 0);
                    setGoogleMapsKey(data.deliveryConfig.googleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
                }

                if (data.referralSettings) {
                    setReferralEnabled(data.referralSettings.enabled ?? false);
                    setRewardAmount(data.referralSettings.rewardAmount ?? 0);
                    setRewardType(data.referralSettings.rewardType ?? 'Wallet');
                    setMinOrderValue(data.referralSettings.minOrderValue ?? 0);
                    setMaxReferrals(data.referralSettings.maxReferralsPerUser ?? 10);
                }
            } else {
                showToast('Failed to update settings', 'error');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Error updating settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing & Charges</h1>
                    <p className="text-sm text-gray-500">Manage delivery fees, platform charges, and thresholds.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>

            <div className="space-y-6">
                {/* General Billing Section */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">General Charges</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Platform/Handling Fee (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={platformFee}
                                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g. 2"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Added to every order as handling charge.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Free Delivery Threshold (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={freeDeliveryThreshold}
                                    onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g. 499"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Orders above this amount will have free delivery.</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Configuration Section */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex justify-between items-start mb-6 pb-2 border-b">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Delivery Configuration</h2>
                            <p className="text-sm text-gray-500">Choose between fixed or distance-based pricing</p>
                        </div>

                        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg">
                            <button
                                onClick={() => setIsDistanceBased(false)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${!isDistanceBased ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Fixed Price
                            </button>
                            <button
                                onClick={() => setIsDistanceBased(true)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${isDistanceBased ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Distance Based
                            </button>
                        </div>
                    </div>

                    {!isDistanceBased ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="max-w-md"
                        >
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fixed Delivery Charge (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={deliveryCharges}
                                    onChange={(e) => setDeliveryCharges(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g. 40"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Flat fee charged for all deliveries below threshold.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
                        >
                            <div className="col-span-full bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 mb-2">
                                <strong>Note:</strong> Distance calculation requires Google Maps API Key. Without a key, it may fallback to straight line distance.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Charge (₹)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={baseCharge}
                                        onChange={(e) => setBaseCharge(Number(e.target.value))}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Min charge for first X kms.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Distance (km)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={baseDistance}
                                        onChange={(e) => setBaseDistance(Number(e.target.value))}
                                        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">km</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Distance covered in base charge.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Extra per km Charge (₹)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={kmRate}
                                        onChange={(e) => setKmRate(Number(e.target.value))}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Charged for every km after base distance.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Boy Commission (₹/km)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={deliveryBoyKmRate}
                                        onChange={(e) => setDeliveryBoyKmRate(Number(e.target.value))}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Amount paid to delivery partner per km.</p>
                            </div>

                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Google Maps API Key (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={googleMapsKey}
                                    onChange={(e) => setGoogleMapsKey(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="AIza..."
                                />
                                <p className="mt-1 text-xs text-gray-500">Required for accurate road distance calculation.</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Referral Program Section */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Referral Program</h2>
                            <p className="text-sm text-gray-500">Manage user referral rewards and limits</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${referralEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                {referralEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <button
                                onClick={async () => {
                                    const newValue = !referralEnabled;
                                    setReferralEnabled(newValue);
                                    // Instant save
                                    try {
                                        const updatePayload: any = {
                                            referralSettings: {
                                                enabled: newValue,
                                                rewardAmount,
                                                minOrderValue,
                                                maxReferralsPerUser: maxReferrals,
                                                rewardType
                                            }
                                        };
                                        const response = await updateAppSettings(updatePayload);
                                        if (response.success && response.data?.referralSettings) {
                                            // Sync state with server response to be sure
                                            setReferralEnabled(response.data.referralSettings.enabled);
                                        }
                                    } catch (error) {
                                        console.error('Failed to auto-save referral status', error);
                                        // Revert on failure
                                        setReferralEnabled(!newValue);
                                    }
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${referralEnabled ? 'bg-green-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${referralEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${referralEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reward Amount (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={rewardAmount || ''}
                                    onChange={(e) => setRewardAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g. 50"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Amount credited to both referrer and referee.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min Order Value for Reward (₹)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={minOrderValue || ''}
                                    onChange={(e) => setMinOrderValue(e.target.value === '' ? 0 : Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g. 299"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Referred user's first order must exceed this.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reward Type
                            </label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setRewardType('Wallet')}
                                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${rewardType === 'Wallet' 
                                        ? 'bg-green-50 border-green-200 text-green-700' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Wallet Money
                                </button>
                                <button
                                    onClick={() => setRewardType('Points')}
                                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${rewardType === 'Points' 
                                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Reward Points
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">How users receive their bonus.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Referrals per User
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={maxReferrals || ''}
                                onChange={(e) => setMaxReferrals(e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g. 10"
                            />
                            <p className="mt-1 text-xs text-gray-500">Max number of friends a user can invite.</p>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg self-end">
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline mr-1 mb-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Rewards are only given after <strong>successful delivery</strong> of the first order.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
