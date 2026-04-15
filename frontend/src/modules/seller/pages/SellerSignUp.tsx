import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, sendEmailOTP, verifyEmailOTP } from '../../../services/api/auth/sellerAuthService';
import GoogleMapsAutocomplete from '../../../components/GoogleMapsAutocomplete';
import { useAuth } from '../../../context/AuthContext';
import LocationPickerMap from '../../../components/LocationPickerMap';
import ServiceAreaMap from '../../../components/ServiceAreaMap';
import { uploadPublicImage, uploadPublicDocument } from '../../../services/api/uploadService';
import { getCategories, Category } from '../../../services/api/categoryService';
import { getHeaderCategoriesPublic, HeaderCategory } from '../../../services/api/headerCategoryService';

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, label: 'Basic Details' },
    { id: 2, label: 'Verification' },
    { id: 3, label: 'Approval' },
    { id: 4, label: 'Deposit' },
    { id: 5, label: 'Selling' }
  ];

  return (
    <div className="mb-8 px-2">
      <div className="flex items-center justify-between max-w-sm mx-auto relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 w-1/5">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all duration-300 ${isActive
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
              <span className={`text-[8px] sm:text-[9px] mt-1.5 font-bold text-center leading-tight transition-colors duration-300 ${isActive ? 'text-teal-700' : 'text-neutral-400'}`}>
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
    executiveName: '',
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
    state: '',
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
    gstCertificateUrl: '',
    isDeliveryByPlatform: true,
    fssaiImage: '',
    deliveryTime: {
      regional: '',
      local: '',
    },
  });
  const [fssaiImageFile, setFssaiImageFile] = useState<File | null>(null);
  const [fssaiImagePreview, setFssaiImagePreview] = useState<string>('');
  const [cancelledChequeFile, setCancelledChequeFile] = useState<File | null>(null);
  const [cancelledChequePreview, setCancelledChequePreview] = useState<string>('');
  const [shopEstablishmentFile, setShopEstablishmentFile] = useState<File | null>(null);
  const [shopEstablishmentPreview, setShopEstablishmentPreview] = useState<string>('');
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [drivingLicensePreview, setDrivingLicensePreview] = useState<string>('');
  const [businessLicenseType, setBusinessLicenseType] = useState<string>('Manufacturer');
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [businessLicensePreview, setBusinessLicensePreview] = useState<string>('');
  const [gstCertificateFile, setGstCertificateFile] = useState<File | null>(null);
  const [gstCertificatePreview, setGstCertificatePreview] = useState<string>('');
  const [formStep, setFormStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [fullHeaderCategories, setFullHeaderCategories] = useState<HeaderCategory[]>([]);

  useEffect(() => {
    const syncCategories = async () => {
      setCategoriesLoading(true);
      try {
        const headerCategories = await getHeaderCategoriesPublic(true);
        if (headerCategories && headerCategories.length > 0) {
          // Filter out categories that shouldn't be show for seller registration
          const excludedCategories = ['99 to199 offers'];
          
          const mappedCategories = headerCategories
            .filter((cat: HeaderCategory) => !excludedCategories.includes(cat.name))
            .map((cat: HeaderCategory) => ({
              _id: cat._id,
              name: cat.name,
              isBestseller: false,
              hasWarning: false
            })) as Category[];
          setCategories(mappedCategories);
          setFullHeaderCategories(headerCategories);
        } else {
          setCategories([]);
          setFullHeaderCategories([]);
        }
      } catch (err) {
        console.error('Failed to sync header categories:', err);
        setCategories([]);
        setFullHeaderCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    syncCategories();
  }, []);

  const showFSSAI = formData.categories.some(cat => 
    ['Vegetable & Fruits', 'Food', 'bakery', 'Grocery', 'Tea Corner'].includes(cat)
  );

  const showAdditionalDocs = formData.categories.length > 0;

  const quickCategories = ['Food', 'bakery', 'Pharmacy', 'pharmacy', 'Vegetable & Fruits', 'Pan Corner', 'pan corner', 'Grocery', 'grocery', 'Tea Corner', 'tea corner'];

  const showShopCertificate = formData.categories.some(cat => 
    ['Food', 'food', 'bakery'].includes(cat) || (cat && !quickCategories.includes(cat))
  );

  const showCheque = formData.categories.some(cat => 
    cat && !['Pan Corner', 'pan corner'].includes(cat)
  );

  const showGST = !formData.categories.some(cat => 
    ['Pan Corner', 'pan corner'].includes(cat)
  );

  const showDrivingLicense = formData.categories.some(cat => 
    ['Pharmacy', 'pharmacy'].includes(cat)
  );

  const showScheduledDocs = formData.categories.some(cat => 
    cat && !quickCategories.includes(cat)
  );

  const selectedHeaderCategory = fullHeaderCategories.find(c => c.name === formData.categories[0]);
  const isScheduledCategory = selectedHeaderCategory?.deliveryType === 'scheduled';

  const toggleCategory = (name: string) => {
    setFormData(prev => ({
      ...prev,
      categories: [name],
      category: name
    }));
  };



  const handleFSSAIImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFssaiImageFile(file);
      if (file.type === 'application/pdf') {
        setFssaiImagePreview('pdf_icon');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFssaiImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cheque' | 'shop' | 'driving' | 'license' | 'gst') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'cheque') {
        setCancelledChequeFile(file);
        if (file.type === 'application/pdf') setCancelledChequePreview('pdf_icon');
        else {
          const reader = new FileReader();
          reader.onloadend = () => setCancelledChequePreview(reader.result as string);
          reader.readAsDataURL(file);
        }
      } else if (type === 'shop') {
        setShopEstablishmentFile(file);
        if (file.type === 'application/pdf') setShopEstablishmentPreview('pdf_icon');
        else {
          const reader = new FileReader();
          reader.onloadend = () => setShopEstablishmentPreview(reader.result as string);
          reader.readAsDataURL(file);
        }
      } else if (type === 'driving') {
        setDrivingLicenseFile(file);
        if (file.type === 'application/pdf') setDrivingLicensePreview('pdf_icon');
        else {
          const reader = new FileReader();
          reader.onloadend = () => setDrivingLicensePreview(reader.result as string);
          reader.readAsDataURL(file);
        }
      } else if (type === 'license') {
        setBusinessLicenseFile(file);
        if (file.type === 'application/pdf') setBusinessLicensePreview('pdf_icon');
        else {
          const reader = new FileReader();
          reader.onloadend = () => setBusinessLicensePreview(reader.result as string);
          reader.readAsDataURL(file);
        }
      } else if (type === 'gst') {
        setGstCertificateFile(file);
        if (file.type === 'application/pdf') setGstCertificatePreview('pdf_icon');
        else {
          const reader = new FileReader();
          reader.onloadend = () => setGstCertificatePreview(reader.result as string);
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const clearDocument = (e: React.MouseEvent, type: 'fssai' | 'cheque' | 'shop' | 'driving' | 'license' | 'gst') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'fssai') {
      setFssaiImageFile(null);
      setFssaiImagePreview('');
    } else if (type === 'cheque') {
      setCancelledChequeFile(null);
      setCancelledChequePreview('');
    } else if (type === 'shop') {
      setShopEstablishmentFile(null);
      setShopEstablishmentPreview('');
    } else if (type === 'driving') {
      setDrivingLicenseFile(null);
      setDrivingLicensePreview('');
    } else if (type === 'license') {
      setBusinessLicenseFile(null);
      setBusinessLicensePreview('');
    } else if (type === 'gst') {
      setGstCertificateFile(null);
      setGstCertificatePreview('');
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

  const handleDeliveryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      deliveryTime: {
        ...prev.deliveryTime,
        [name]: value
      }
    }));
  };



  const handleSendEmailOTP = async () => {
    if (!formData.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setEmailSending(true);
    setError('');
    try {
      const res = await sendEmailOTP(formData.email);
      if (res.success) {
        setEmailOtpSent(true);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    setEmailVerifying(true);
    setError('');
    try {
      const res = await verifyEmailOTP(formData.email, emailOtp);
      if (res.success) {
        setIsEmailVerified(true);
        setEmailOtpSent(false);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleNextStep = () => {
    if (!formData.sellerName || !formData.email || !formData.storeName) {
      setError('Please fill in all required fields');
      return;
    }
    if (!isEmailVerified) {
      setError('Please verify your email address first');
      return;
    }
    setError('');
    setFormStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSkipTest = () => {
    if (formStep === 1) {
      setFormData(prev => ({
        ...prev,
        sellerName: prev.sellerName || 'Test Seller',
        email: prev.email || `test${Math.floor(Math.random() * 10000)}@example.com`,
        storeName: prev.storeName || 'Test Store',
      }));
      setIsEmailVerified(true);
      setFormStep(2);
    } else {
      setFormData(prev => ({
        ...prev,
        mobile: prev.mobile || '9876543210',
        upiId: prev.upiId || 'test@okaxis',
        categories: prev.categories.length > 0 ? prev.categories : ['Grocery'],
        category: prev.category || 'Grocery',
        latitude: prev.latitude || '28.6139',
        longitude: prev.longitude || '77.2090',
        city: prev.city || 'Test City',
        state: prev.state || 'Test State',
        pincode: prev.pincode || '123456',
        nearestLandmark: prev.nearestLandmark || 'Test Landmark',
        address: prev.address || 'Test Address'
      }));
      // Scroll to bottom so user can see Create button
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
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
    if (!formData.upiId) {
      setError('Please enter your UPI ID');
      return;
    }
    setError('');

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
          const uploadRes = await uploadPublicDocument(fssaiImageFile, 'sellers/fssai');
          fssaiImageUrl = uploadRes.secureUrl;
        } catch (uploadErr) {
          console.error('FSSAI Upload failed:', uploadErr);
          setError('Failed to upload FSSAI document. Please try again.');
          setLoading(false);
          return;
        }
      }

      let cancelledChequeUrl = '';
      if (showAdditionalDocs && cancelledChequeFile) {
        try {
          const uploadRes = await uploadPublicDocument(cancelledChequeFile, 'sellers/verification');
          cancelledChequeUrl = uploadRes.secureUrl;
        } catch (uploadErr) {
          console.error('Cheque Upload failed:', uploadErr);
        }
      }

      let shopEstablishmentUrl = '';
      if (showShopCertificate && shopEstablishmentFile) {
        try {
          const uploadRes = await uploadPublicDocument(shopEstablishmentFile, 'sellers/verification');
          shopEstablishmentUrl = uploadRes.secureUrl;
        } catch (uploadErr) {
          console.error('Shop Cert Upload failed:', uploadErr);
        }
      }

      let drivingLicenseUrl = '';
      if (showDrivingLicense && drivingLicenseFile) {
        try {
          const uploadRes = await uploadPublicDocument(drivingLicenseFile, 'sellers/verification');
          drivingLicenseUrl = uploadRes.secureUrl;
        } catch (uploadErr) {
          console.error('Driving License Upload failed:', uploadErr);
        }
      }

      let businessLicenseUrl = '';
      if (showScheduledDocs && businessLicenseFile) {
        try {
          const uploadRes = await uploadPublicDocument(businessLicenseFile, 'sellers/verification');
          businessLicenseUrl = uploadRes.secureUrl;
        } catch (uploadErr) {
          console.error('Business License Upload failed:', uploadErr);
        }
      }
      
      let gstCertificateUrl = '';
      if (showGST && gstCertificateFile) {
        try {
          const uploadRes = await uploadPublicDocument(gstCertificateFile, 'sellers/verification');
          gstCertificateUrl = uploadRes.secureUrl;
        } catch (uploadErr) {
          console.error('GST Certificate Upload failed:', uploadErr);
        }
      }

      const response = await register({
        sellerName: formData.sellerName,
        executiveName: formData.executiveName,
        mobile: formData.mobile,
        email: formData.email,
        storeName: formData.storeName,
        category: formData.category,
        categories: formData.categories,
        address: formData.address || formData.searchLocation,
        city: formData.city,
        state: formData.state,
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
        bankName: formData.bankName,
        branch: formData.branch,
        ifsc: formData.ifsc,
        upiId: formData.upiId,
        gstNumber: formData.gstNumber,
        gstCertificateUrl: gstCertificateUrl,
        panCard: formData.panCard,
        alternateMobile: formData.alternateMobile,
        nearestLandmark: formData.nearestLandmark,
        isDeliveryByPlatform: formData.isDeliveryByPlatform,
        cancelledChequeUrl,
        shopEstablishmentUrl,
        drivingLicenseUrl,
        businessLicenseUrl,
        businessLicenseType,
        deliveryTime: isScheduledCategory ? {
          regional: formData.deliveryTime.regional,
          local: formData.deliveryTime.local,
        } : undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-8">
      {/* Back Button */}
      <button
        onClick={() => {
          if (formStep === 2) {
            setFormStep(1);
          } else {
            navigate(-1);
          }
        }}
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
              className="h-20 sm:h-28 w-auto object-contain bg-white/90 rounded-xl p-2 shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Seller Sign Up</h1>
          <p className="text-teal-100 text-sm">Create your seller account</p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <StepIndicator currentStep={isSuccess ? 3 : formStep} />

          {!isSuccess && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={handleSkipTest}
                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                </svg>
                SKIP FOR TEST
              </button>
            </div>
          )}

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
            {formStep === 1 && (
  <div className="space-y-4 animate-fadeIn">
    <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider flex items-center">
      <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mr-2 text-[10px]">
        1
      </span>
      Basic Details
    </h3>

    {/* Seller Name */}
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

    {/* Executive Name (ONLY ONE FIELD) */}
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Executive Name
      </label>
      <input
        type="text"
        name="executiveName"
        value={formData.executiveName || ""}
        onChange={handleInputChange}
        placeholder="Enter executive name"
        className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all"
        disabled={loading}
      />
    </div>

    {/* Email */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700">
        Email <span className="text-red-500">*</span>
      </label>

      <div className="flex flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter email address"
            required
            readOnly={isEmailVerified}
            className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
              isEmailVerified
                ? "bg-green-50 border-green-200 text-green-700"
                : "border-neutral-300 focus:border-teal-500"
            }`}
            disabled={loading || emailSending}
          />

          {isEmailVerified && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M20 6L9 17L4 12" />
              </svg>
            </div>
          )}
        </div>

        {!isEmailVerified && (
          <button
            type="button"
            onClick={handleSendEmailOTP}
            disabled={emailSending || !formData.email}
            className="px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold hover:bg-teal-100 disabled:opacity-50 transition-colors whitespace-nowrap min-w-[90px]"
          >
            {emailSending ? "..." : emailOtpSent ? "Resend" : "Send"}
          </button>
        )}
      </div>
    </div>

    {/* OTP */}
    {emailOtpSent && !isEmailVerified && (
      <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl animate-scaleIn">
        <label className="block text-xs font-bold text-teal-800 uppercase mb-2">
          Enter Verification Code
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={emailOtp}
            onChange={(e) =>
              setEmailOtp(e.target.value.replace(/\D/g, ""))
            }
            placeholder="6-digit OTP"
            maxLength={6}
            className="w-full sm:flex-1 px-4 py-3 text-center text-lg font-bold tracking-[0.5em] border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />

          <button
            type="button"
            onClick={handleVerifyEmailOTP}
            disabled={emailVerifying || emailOtp.length !== 6}
            className="w-full sm:w-auto px-6 py-3 bg-teal-700 text-white rounded-xl text-sm font-bold hover:bg-teal-800 disabled:bg-teal-300 transition-all active:scale-95 shadow-md shadow-teal-100"
          >
            {emailVerifying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              "Verify OTP"
            )}
          </button>
        </div>

        <p className="mt-2 text-[10px] text-teal-600">
          Please check your inbox (and spam) for the code.
        </p>
      </div>
    )}

    {/* Store Name */}
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

    {/* Button */}
    <button
      type="button"
      onClick={handleNextStep}
      className="w-full mt-6 py-4 bg-gradient-to-r from-teal-700 to-teal-900 text-white rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
    >
      Continue to Verification
      <svg
        className="ml-2 w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  </div>
)}

              {/* Step 2: Document Verification */}
              {formStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider flex items-center">
                    <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mr-2 text-[10px]">2</span>
                    Document Verification
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700">
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
                          placeholder="Mobile number"
                          required
                          maxLength={10}
                          className="flex-1 px-3 py-3 text-sm placeholder:text-neutral-400 focus:outline-none"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700">
                        Alternate Contact (Optional)
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
                          placeholder="Alternate number"
                          maxLength={10}
                          className="flex-1 px-3 py-3 text-sm placeholder:text-neutral-400 focus:outline-none"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Categories <span className="text-red-500">*</span>
                    </label>
                    {categoriesLoading ? (
                      <div className="flex items-center gap-3 py-4 text-teal-600 bg-teal-50/50 rounded-xl px-4 border border-teal-100/50">
                        <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Fetching categories...</span>
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="text-sm text-neutral-500 py-3 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
                        No categories found.
                      </div>
                    ) : (
                      <select
                        value={formData.categories[0] || ''}
                        onChange={(e) => toggleCategory(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white shadow-sm font-medium"
                        disabled={loading}
                      >
                        <option value="" disabled>Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {isScheduledCategory && (
                    <div className="space-y-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl animate-fadeIn">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold">!</div>
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Delivery Time (Scheduled)</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1 ml-1">Regional Delivery Time *</label>
                          <input
                            type="text"
                            name="regional"
                            value={formData.deliveryTime.regional}
                            onChange={handleDeliveryTimeChange}
                            placeholder="e.g. 3-5 Days"
                            required={isScheduledCategory}
                            className="w-full px-4 py-3 text-sm border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1 ml-1">Local Delivery Time *</label>
                          <input
                            type="text"
                            name="local"
                            value={formData.deliveryTime.local}
                            onChange={handleDeliveryTimeChange}
                            placeholder="e.g. 1-2 Days"
                            required={isScheduledCategory}
                            className="w-full px-4 py-3 text-sm border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-600 italic px-1">Specify estimated delivery times for regional and local shipping.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Store Location <span className="text-red-500">*</span>
                    </label>
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
                          state: components?.state || prev.state,
                        }));
                      }}
                      placeholder="Search store location..."
                      disabled={loading}
                    />

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Nearest Landmark *</label>
                      <input
                        type="text"
                        name="nearestLandmark"
                        value={formData.nearestLandmark}
                        onChange={handleInputChange}
                        placeholder="e.g. Near City Hospital"
                        required
                        className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 transition-all font-medium"
                        disabled={loading}
                      />
                    </div>

                    {formData.latitude && formData.longitude && (
                      <div className="relative h-48 rounded-2xl overflow-hidden border border-neutral-200">
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
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        required
                        className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        required
                        className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="Pincode"
                        required
                        maxLength={6}
                        className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-100">
                    <h4 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-4">Verification Documents</h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 bg-teal-50/50 rounded-xl border border-teal-100/50">
                        <div className="flex-1 pr-4">
                          <h5 className="text-sm font-bold text-teal-900">Delivery Partner</h5>
                          <p className="text-[10px] text-teal-700">Allow platform delivery partners</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.isDeliveryByPlatform}
                            onChange={(e) => setFormData(prev => ({ ...prev, isDeliveryByPlatform: e.target.checked }))}
                            disabled={loading}
                          />
                          <div className="w-11 h-6 bg-neutral-200 rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">PAN Card</label>
                        <input
                          type="text"
                          name="panCard"
                          value={formData.panCard}
                          onChange={handleInputChange}
                          placeholder="PAN Card Number"
                          className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 uppercase"
                          disabled={loading}
                        />
                      </div>

                      {showFSSAI && (
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-teal-900 text-center">FSSAI License Document *</label>
                          <div className="relative h-32 border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-all overflow-hidden group">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleFSSAIImageChange}
                              className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                              disabled={loading}
                            />
                            {fssaiImagePreview ? (
                              <div className="relative w-full h-full">
                                {fssaiImagePreview === 'pdf_icon' ? (
                                  <div className="flex flex-col items-center justify-center h-full text-teal-600 bg-teal-50/30">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                      <polyline points="14 2 14 8 20 8"></polyline>
                                      <line x1="16" y1="13" x2="8" y2="13"></line>
                                      <line x1="16" y1="17" x2="8" y2="17"></line>
                                      <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">PDF Document</span>
                                  </div>
                                ) : (
                                  <img src={fssaiImagePreview} alt="FSSAI Preview" className="w-full h-full object-contain" />
                                )}
                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={(e) => clearDocument(e, 'fssai')}
                                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="text-xs font-bold text-teal-800">Upload FSSAI License</p>
                                <p className="text-[10px] text-neutral-500">JPG, PNG, PDF (Max 2MB)</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {showDrivingLicense && (
                        // ... existing driving license UI ...
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-teal-900 text-center">Drug License Document *</label>
                          <div className="relative h-32 border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-all overflow-hidden group">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleDocumentChange(e, 'driving')}
                              className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                              disabled={loading}
                            />
                            {drivingLicensePreview ? (
                              <div className="relative w-full h-full">
                                {drivingLicensePreview === 'pdf_icon' ? (
                                  <div className="flex flex-col items-center justify-center h-full text-teal-600 bg-teal-50/30">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                      <polyline points="14 2 14 8 20 8"></polyline>
                                    </svg>
                                    <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">PDF</span>
                                  </div>
                                ) : (
                                  <img src={drivingLicensePreview} alt="Driving License" className="w-full h-full object-contain" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => clearDocument(e, 'driving')}
                                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="text-xs font-bold text-teal-800">Upload Driving License</p>
                                <p className="text-[10px] text-neutral-500">JPG, PNG, PDF (Max 2MB)</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {showScheduledDocs && (
                        <div className="space-y-4 pt-2 border-t border-neutral-100">
                          <div>
                            <label className="block text-sm font-bold text-teal-900 mb-2">Brand listing</label>
                            <select
                              value={businessLicenseType}
                              onChange={(e) => setBusinessLicenseType(e.target.value)}
                              className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white shadow-sm font-medium"
                              disabled={loading}
                            >
                              <option value="Manufacturer">Manufacturer</option>
                              <option value="Supplier">Supplier</option>
                              <option value="Dealer">Dealer</option>
                              <option value="Distributor">Distributor</option>
                              <option value="Export/Import">Export/Import</option>
                              <option value="Retailer">Retailer</option>
                              <option value="Wholesaler">Wholesaler</option>
                            </select>
                          </div>

                          <div className="space-y-3">
                            <label className="block text-sm font-bold text-teal-900 text-center">
                              {businessLicenseType === 'Manufacturer' ? 'Trademark Registration Certificate' : 
                               businessLicenseType === 'Supplier' ? 'Supplier Agreement or Brand Approval Letter' : 
                               businessLicenseType === 'Dealer' ? 'Dealer Territory Letter or Approved Letter from the brand' :
                               businessLicenseType === 'Distributor' ? 'Duplicate Confirmation Letter from the brand' :
                               businessLicenseType === 'Export/Import' ? 'Import Export Licence' :
                               businessLicenseType === 'Retailer' ? 'Retailer Corporation of a Letter' :
                               businessLicenseType === 'Wholesaler' ? 'Trade Licence' : 'Business License'} *
                            </label>
                            <div className="relative h-32 border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-all overflow-hidden group">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleDocumentChange(e, 'license')}
                                className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                disabled={loading}
                              />
                              {businessLicensePreview ? (
                                <div className="relative w-full h-full">
                                  {businessLicensePreview === 'pdf_icon' ? (
                                    <div className="flex flex-col items-center justify-center h-full text-teal-600 bg-teal-50/30">
                                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                      </svg>
                                      <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">PDF</span>
                                    </div>
                                  ) : (
                                    <img src={businessLicensePreview} alt="License" className="w-full h-full object-contain" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => clearDocument(e, 'license')}
                                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <p className="text-xs font-bold text-teal-800 px-4 text-center">
                                    Upload {businessLicenseType === 'Manufacturer' ? 'Trademark Registration' : 
                                            businessLicenseType === 'Supplier' ? 'Supplier Agreement/Brand Approval' : 
                                            businessLicenseType === 'Dealer' ? 'Dealer Territory/Approved Letter' :
                                            businessLicenseType === 'Distributor' ? 'Confirmation Letter' :
                                            businessLicenseType === 'Export/Import' ? 'Export Import License' :
                                            businessLicenseType === 'Retailer' ? 'Retailer Corporation Letter' :
                                            businessLicenseType === 'Wholesaler' ? 'Trade License' : 'License'}
                                  </p>
                                  <p className="text-[10px] text-neutral-500">JPG, PNG, PDF (Max 2MB)</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {showAdditionalDocs && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {showCheque && (
                            <div className="space-y-3">
                              <label className="block text-xs font-bold text-teal-900 text-center">Cancelled Cheque *</label>
                              <div className="relative h-28 border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-all overflow-hidden group">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleDocumentChange(e, 'cheque')}
                                  className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                  disabled={loading}
                                />
                                {cancelledChequePreview ? (
                                  <div className="relative w-full h-full">
                                    {cancelledChequePreview === 'pdf_icon' ? (
                                      <div className="flex flex-col items-center justify-center h-full text-teal-600 bg-teal-50/30">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                          <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                        <span className="mt-1 text-[8px] font-bold uppercase">PDF</span>
                                      </div>
                                    ) : (
                                      <img src={cancelledChequePreview} alt="Cheque" className="w-full h-full object-contain" />
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => clearDocument(e, 'cheque')}
                                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-20"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-1 text-teal-600">
                                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                                      <line x1="16" y1="5" x2="22" y2="5" />
                                      <line x1="19" y1="2" x2="19" y2="8" />
                                    </svg>
                                    <p className="text-[8px] font-bold text-teal-800">Cheque/Bank</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {showShopCertificate && (
                            <div className={showCheque ? "space-y-3" : "space-y-3 col-span-2"}>
                              <label className="block text-xs font-bold text-teal-900 text-center">Shop Establishment Certificate *</label>
                              <div className="relative h-28 border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-all overflow-hidden group">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleDocumentChange(e, 'shop')}
                                  className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                  disabled={loading}
                                />
                                {shopEstablishmentPreview ? (
                                  <div className="relative w-full h-full">
                                    {shopEstablishmentPreview === 'pdf_icon' ? (
                                      <div className="flex flex-col items-center justify-center h-full text-teal-600 bg-teal-50/30">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                          <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                        <span className="mt-1 text-[8px] font-bold uppercase tracking-widest">PDF</span>
                                      </div>
                                    ) : (
                                      <img src={shopEstablishmentPreview} alt="Shop Cert" className="w-full h-full object-contain" />
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => clearDocument(e, 'shop')}
                                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-20"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-1 text-teal-600">
                                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                                      <line x1="16" y1="5" x2="22" y2="5" />
                                      <line x1="19" y1="2" x2="19" y2="8" />
                                    </svg>
                                    <p className="text-[8px] font-bold text-teal-800">Certificate</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-4">
                          {showGST && (
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-2">GST Number</label>
                              <input
                                type="text"
                                name="gstNumber"
                                value={formData.gstNumber}
                                onChange={handleInputChange}
                                placeholder="15-digit GST Number"
                                maxLength={15}
                                className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 uppercase"
                                disabled={loading}
                              />
                              <p className="mt-1 px-1">
                                <a 
                                  href="https://reg.gst.gov.in/registration/" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-teal-600 hover:text-teal-800 font-medium underline"
                                >
                                  Don't have a GST number? Click here for enrollment
                                </a>
                              </p>

                              <div className="mt-4 space-y-3">
                                <label className="block text-sm font-bold text-teal-900 text-center">GST Certificate</label>
                                <div className="relative h-32 border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-all overflow-hidden group">
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleDocumentChange(e, 'gst')}
                                    className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                    disabled={loading}
                                  />
                                  {gstCertificatePreview ? (
                                    <div className="relative w-full h-full">
                                      {gstCertificatePreview === 'pdf_icon' ? (
                                        <div className="flex flex-col items-center justify-center h-full text-teal-600 bg-teal-50/30">
                                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                          </svg>
                                          <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">PDF</span>
                                        </div>
                                      ) : (
                                        <img src={gstCertificatePreview} alt="GST Cert" className="w-full h-full object-contain" />
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => clearDocument(e, 'gst')}
                                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                          <line x1="18" y1="6" x2="6" y2="18"></line>
                                          <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <p className="text-xs font-bold text-teal-800">Upload GST Certificate</p>
                                      <p className="text-[10px] text-neutral-500">JPG, PNG, PDF (Max 2MB)</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Account Number</label>
                            <input
                              type="text"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleInputChange}
                              placeholder="Account Number"
                              className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 bg-white"
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
                              placeholder="IFSC Code"
                              className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500 uppercase bg-white"
                              disabled={loading}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">UPI ID *</label>
                          <input
                            type="text"
                            name="upiId"
                            value={formData.upiId}
                            onChange={handleInputChange}
                            placeholder="e.g., username@bank"
                            className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-teal-500"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

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
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl text-center border border-red-100">
                  {error}
                </div>
              )}

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


