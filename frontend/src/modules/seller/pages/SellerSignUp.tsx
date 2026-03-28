import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../../services/api/auth/sellerAuthService';
import GoogleMapsAutocomplete from '../../../components/GoogleMapsAutocomplete';
import { useAuth } from '../../../context/AuthContext';
import LocationPickerMap from '../../../components/LocationPickerMap';
import ServiceAreaMap from '../../../components/ServiceAreaMap';
import { uploadPublicImage } from '../../../services/api/uploadService';
import { getCategories, Category } from '../../../services/api/categoryService';
import { getHeaderCategoriesPublic, HeaderCategory } from '../../../services/api/headerCategoryService';

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, label: 'Register Store' },
    { id: 2, label: 'Admin Approval' },
    { id: 3, label: 'Pay Deposit' },
    { id: 4, label: 'Start Selling' }
  ];

  return (
    <div className="mb-8 px-4">
      <div className="flex items-center justify-between max-w-sm mx-auto relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 w-1/4">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${isActive
                  ? 'bg-teal-600 border-teal-600 text-white scale-110'
                  : isCompleted
                    ? 'bg-teal-500 border-teal-500 text-white'
                    : 'bg-white border-neutral-300 text-neutral-400'
                  }`}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17L4 12" />
                  </svg>
                ) : step.id}
              </div>
              <span className={`text-[9px] mt-1.5 font-semibold text-center leading-tight whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-teal-700' : 'text-neutral-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SellerSignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    sellerName: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    storeName: '',
    nearestLandmark: '',
    category: '',
    categories: [] as string[],
    pincode: '',
    address: '',
    city: '',
    panCard: '',
    fssaiLicNo: '',
    storeDescription: '',
    taxName: '',
    taxNumber: '',
    searchLocation: '',
    latitude: '',
    longitude: '',
    serviceRadiusKm: '10',
    serviceAreaType: 'radius',
    serviceAreaCoordinates: [] as number[][], // Coordinates for custom polygon
    accountName: '',
    bankName: '',
    branch: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
    gstNumber: '',
    isDeliveryByPlatform: true,
    fssaiImage: '',
  });
  const [fssaiImageFile, setFssaiImageFile] = useState<File | null>(null);
  const [fssaiImagePreview, setFssaiImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Sync with Home Page categories by fetching from API
    const syncCategories = async () => {
      const headerCategories = await getHeaderCategoriesPublic();
      const mappedCategories = headerCategories.map((cat: HeaderCategory) => ({
        _id: cat._id,
        name: cat.name,
        isBestseller: false,
        hasWarning: false
      })) as Category[];
      setCategories(mappedCategories);
    };
    syncCategories();
  }, []);

  const showFSSAI = formData.categories.some(cat => 
    ['Vegetable & Fruits', 'Food', 'bakery'].includes(cat)
  );

  const toggleCategory = (name: string) => {
    setFormData(prev => {
      const isSelected = prev.categories.includes(name);
      if (isSelected) {
        return {
          ...prev,
          categories: prev.categories.filter(c => c !== name),
          // Also clear the main category if it was this one
          category: prev.category === name ? (prev.categories.length > 1 ? prev.categories.filter(c => c !== name)[0] : '') : prev.category
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, name],
          // If no main category is selected, use this one
          category: prev.category ? prev.category : name
        };
      }
    });
  };



  const handleFSSAIImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFssaiImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFssaiImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      setFormData(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '').slice(0, 10),
      }));
    } else if (name === 'serviceRadiusKm') {
      const cleanedValue = value.replace(/[^0-9.]/g, '');
      const parts = cleanedValue.split('.');
      const finalValue = parts.length > 2 ? `${parts[0]}.${parts[1]}` : cleanedValue;
      setFormData(prev => ({
        ...prev,
        [name]: finalValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields (password removed - not needed during signup)
    if (!formData.sellerName) {
      setError('Please enter your name');
      return;
    }
    if (!formData.mobile) {
      setError('Please enter your mobile number');
      return;
    }
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.storeName) {
      setError('Please enter your store name');
      return;
    }
    if (formData.categories.length === 0) {
      setError('Please select at least one category');
      return;
    }
    if (!formData.address && !formData.searchLocation) {
      setError('Please select your store location');
      return;
    }
    if (!formData.city) {
      setError('Please enter your city');
      return;
    }
    if (!formData.nearestLandmark) {
      setError('Please enter the nearest landmark');
      return;
    }
    if (formData.mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate location is selected
      if (!formData.latitude || !formData.longitude) {
        setError('Please select your store location');
        setLoading(false);
        return;
      }

      let fssaiImageUrl = '';
      if (showFSSAI && fssaiImageFile) {
        try {
          const uploadRes = await uploadPublicImage(fssaiImageFile, 'sellers/fssai');
          fssaiImageUrl = uploadRes.secureUrl;
        } catch (uploadErr) {
          console.error('FSSAI Upload failed:', uploadErr);
          setError('Failed to upload FSSAI image. Please try again.');
          setLoading(false);
          return;
        }
      }

      const response = await register({
        sellerName: formData.sellerName,
        mobile: formData.mobile,
        email: formData.email,
        storeName: formData.storeName,
        category: formData.category,
        categories: formData.categories,
        address: formData.address || formData.searchLocation,
        city: formData.city,
        pincode: formData.pincode,
        searchLocation: formData.searchLocation,
        latitude: formData.latitude,
        longitude: formData.longitude,
        serviceRadiusKm: formData.serviceAreaType === 'radius' ? parseFloat(formData.serviceRadiusKm) : 10,
        serviceAreaGeo: formData.serviceAreaType === 'polygon' && formData.serviceAreaCoordinates.length > 0 ? {
          type: 'Polygon',
          coordinates: [formData.serviceAreaCoordinates]
        } : null,
        fssaiLicNo: fssaiImageUrl, // Store image URL in the license number field for now, or use fssaiImage if you updated the model
        storeDescription: formData.storeDescription,
        accountNumber: formData.accountNumber,
        ifsc: formData.ifsc,
        upiId: formData.upiId,
        gstNumber: formData.gstNumber,
        panCard: formData.panCard,
        alternateMobile: formData.alternateMobile,
        nearestLandmark: formData.nearestLandmark,
        isDeliveryByPlatform: formData.isDeliveryByPlatform,
      });

      if (response.success) {
        setIsSuccess(true);
        // Auto-login the seller
        if (response.data.token && response.data.user) {
          // Explicitly set userType to 'Seller' for routing logic
          const userData = { ...response.data.user, userType: 'Seller' as const };
          login(response.data.token, userData);
        }

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/seller/verification-pending');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex flex-col items-center justify-center px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Sign Up Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
        {/* Header Section */}
        <div className="px-6 py-6 text-center bg-gradient-to-br from-teal-700 to-teal-900">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/jyastiLogo.png"
              alt="JYASTI builds trust"
              className="h-28 w-auto object-contain bg-white/90 rounded-xl p-2 shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Seller Sign Up</h1>
          <p className="text-teal-100 text-sm">Create your seller account</p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <StepIndicator currentStep={isSuccess ? 2 : 1} />

          {isSuccess ? (
            <div className="py-12 text-center animate-fadeIn">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17L4 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Registration Submitted!</h2>
              <p className="text-neutral-600 px-6">
                Registration submitted successfully. Your account is under admin review.
              </p>
              <div className="mt-8 flex justify-center items-center">
                <div className="w-6 h-6 border-b-2 border-teal-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-sm text-neutral-500 font-medium">Redirecting to login...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider flex items-center">
                  <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mr-2 text-[10px]">1</span>
                  Basic Details
                </h3>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seller Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                    className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center bg-white border border-neutral-300 rounded-xl overflow-hidden focus-within:border-teal-500 transition-all">
                    <div className="px-3 py-3 text-sm font-medium text-neutral-600 border-r border-neutral-300 bg-neutral-50">
                      +91
                    </div>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter mobile number"
                      required
                      maxLength={10}
                      className="flex-1 px-3 py-3 text-sm placeholder:text-neutral-400 focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Alternate Contact Number (Optional)
                  </label>
                  <div className="flex items-center bg-white border border-neutral-300 rounded-xl overflow-hidden focus-within:border-teal-500 transition-all">
                    <div className="px-3 py-3 text-sm font-medium text-neutral-600 border-r border-neutral-300 bg-neutral-50">
                      +91
                    </div>
                    <input
                      type="tel"
                      name="alternateMobile"
                      value={formData.alternateMobile}
                      onChange={handleInputChange}
                      placeholder="Enter alternate number"
                      maxLength={10}
                      className="flex-1 px-3 py-3 text-sm placeholder:text-neutral-400 focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleInputChange}
                    placeholder="Enter store name"
                    required
                    className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Categories <span className="text-red-500">*</span>
                  </label>
                  {categories.length === 0 ? (
                    <div className="text-sm text-neutral-500 py-2">
                      Loading categories...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-neutral-200 rounded-lg">
                      {categories.map((cat) => {
                        const checked = formData.categories.includes(cat.name);
                        return (
                          <label key={cat._id} className="flex items-center gap-2 text-sm text-neutral-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(cat.name)}
                              disabled={loading}
                              className="h-4 w-4 text-teal-600 border-neutral-300 rounded focus:ring-teal-500"
                            />
                            <span>{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {formData.categories.length === 0 && categories.length > 0 && (
                    <p className="text-xs text-red-600 mt-1">Select at least one category</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Store Address <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <GoogleMapsAutocomplete
                        value={formData.searchLocation}
                        onChange={(address: string, lat: number, lng: number, placeName: string, components?: { city?: string; state?: string }) => {
                          setFormData(prev => ({
                            ...prev,
                            searchLocation: address,
                            latitude: lat.toString(),
                            longitude: lng.toString(),
                            address: address,
                            city: components?.city || prev.city,
                          }));
                        }}
                        placeholder="Search your store address..."
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nearest Landmark <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nearestLandmark"
                      value={formData.nearestLandmark}
                      onChange={handleInputChange}
                      placeholder="e.g. Near City Hospital or Landmark"
                      required
                      className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                      disabled={loading}
                    />
                  </div>

                  {formData.latitude && formData.longitude ? (
                    <div className="mt-4 animate-fadeIn">
                      <LocationPickerMap
                        initialLat={parseFloat(formData.latitude)}
                        initialLng={parseFloat(formData.longitude)}
                        onLocationSelect={(lat, lng) => {
                          setFormData(prev => ({
                            ...prev,
                            latitude: lat.toString(),
                            longitude: lng.toString()
                          }));
                        }}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      required
                      className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="6-digit pincode"
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Optional Details */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider flex items-center">
                  <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mr-2 text-[10px]">4</span>
                  Optional Details
                </h3>

                {/* Delivery Partner Toggle */}
                <div className="flex items-center justify-between p-4 bg-teal-50/50 rounded-xl border border-teal-100/50">
                  <div className="flex-1 pr-4">
                    <h4 className="text-sm font-bold text-teal-900 leading-tight">Delivery Partner</h4>
                    <p className="text-[10px] text-teal-700 mt-1 leading-relaxed">
                      Enable to allow platform delivery partners to fulfill your orders. Disable if you'll handle deliveries yourself.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.isDeliveryByPlatform}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDeliveryByPlatform: e.target.checked }))}
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">PAN Card</label>
                    <input
                      type="text"
                      name="panCard"
                      value={formData.panCard}
                      onChange={handleInputChange}
                      placeholder="PAN Card Number"
                      className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                      disabled={loading}
                    />
                  </div>
                  {showFSSAI && (
                    <div className="sm:col-span-2 space-y-3">
                      <label className="block text-sm font-bold text-teal-900">
                        FSSAI License Image <span className="text-red-500">*</span>
                      </label>
                      <div 
                        className="relative group cursor-pointer"
                        style={{ height: '160px' }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFSSAIImageChange}
                          className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                          disabled={loading}
                        />
                        <div className={`absolute inset-0 z-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${fssaiImagePreview ? 'border-teal-500 bg-teal-50' : 'border-neutral-300 bg-neutral-50 group-hover:bg-neutral-100 group-hover:border-teal-400'}`}>
                          {fssaiImagePreview ? (
                            <div className="relative w-full h-full p-2">
                              <img src={fssaiImagePreview} alt="FSSAI Preview" className="w-full h-full object-contain rounded-xl" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                <span className="text-white text-xs font-bold">Change Image</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 text-teal-600">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                                </svg>
                              </div>
                              <p className="text-xs font-bold text-teal-800 tracking-tight">Upload FSSAI License</p>
                              <p className="text-[10px] text-neutral-500 mt-1">Supports JPG, PNG (Max 2MB)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">GST Number</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      placeholder="Enter 15-digit GST number"
                      maxLength={15}
                      className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all uppercase"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Bank Account Number"
                      className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">IFSC Code</label>
                    <input
                      type="text"
                      name="ifsc"
                      value={formData.ifsc}
                      onChange={handleInputChange}
                      placeholder="Bank IFSC Code"
                      className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all uppercase"
                      disabled={loading}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">UPI ID</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      placeholder="Enter UPI ID (e.g. name@bank)"
                      className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl text-center border border-red-100">
                  {error}
                </div>
              )}



              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center ${!loading
                  ? 'bg-gradient-to-r from-teal-700 to-teal-900 text-white'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    Processing...
                  </>
                ) : (
                  'Create Seller Account'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-neutral-100">
                <p className="text-sm text-neutral-500">
                  Already have a seller account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/seller/login')}
                    className="text-teal-700 hover:text-teal-900 font-bold ml-1 transition-colors"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-neutral-500 text-center max-w-md">
        By continuing, you agree to JYASTI builds trust's Terms of Service and Privacy Policy
      </p>
    </div>
  );
}


