import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getProfile, CustomerProfile, applyReferralCode, getReferralStats } from '../../services/api/customerService';
import { getPublicSpinnerSettings } from '../../services/api/customerHomeService';
import { useThemeContext } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import LuckySpin from '../../components/LuckySpin';
import { useSpinner } from '../../hooks/useSpinner';

export default function Account() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const { currentTheme } = useThemeContext();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [showGstModal, setShowGstModal] = useState(false);
  const { showToast } = useToast();
  const [referralStats, setReferralStats] = useState<{
    referralCode: string;
    isReferralApplied: boolean;
    appliedCode: string | null;
    referralCount: number;
    referralEarnings: number;
    referredUsers: Array<{ name: string; date: string; isCompleted: boolean }>;
  } | null>(null);
  const [referralInput, setReferralInput] = useState('');
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [spinnerSettings, setSpinnerSettings] = useState<any>(null);
  const { showLuckySpin, setShowLuckySpin, triggerSpinner, config: spinnerConfig } = useSpinner(spinnerSettings);
  const { cart, clearCart } = useCart();
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getProfile();
        if (response.success) {
          setProfile(response.data);
          // Fetch referral stats if profile loaded
          fetchReferralStats();
          
          // Check for pending referral code from URL
          const pendingCode = localStorage.getItem('pendingReferralCode');
          if (pendingCode && !response.data.isReferralApplied) {
            setReferralInput(pendingCode);
          }
        } else {
          setError('Failed to load profile');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
        if (err.response?.status === 401) {
          authLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchReferralStats = async () => {
      try {
        const response = await getReferralStats();
        if (response.success) {
          setReferralStats(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch referral stats', err);
      }
    };

    const fetchSpinnerSettings = async () => {
      try {
        const response = await getPublicSpinnerSettings();
        if (response.success) {
          setSpinnerSettings(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch spinner settings', err);
      }
    };

    if (user) {
      fetchProfile();
      fetchSpinnerSettings();
    } else {
      setLoading(false);
    }
  }, [user, navigate, authLogout]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  const handleGstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGstModal(false);
  };

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) {
      showToast('Please enter a referral code', 'error');
      return;
    }

    try {
      setIsApplyingReferral(true);
      const response = await applyReferralCode(referralInput.trim());
      if (response.success) {
        showToast(response.message || 'Referral code applied successfully!', 'success');
        localStorage.removeItem('pendingReferralCode');
        // Refresh profile and stats to update states
        const [profileRes, statsRes] = await Promise.all([getProfile(), getReferralStats()]);
        if (profileRes.success) setProfile(profileRes.data);
        if (statsRes.success) setReferralStats(statsRes.data);
      } else {
        showToast(response.message || 'Failed to apply referral code', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to apply referral code', 'error');
    } finally {
      setIsApplyingReferral(false);
    }
  };

  const handleShareReferral = async () => {
    const code = referralStats?.referralCode || profile?.refCode;
    if (!code) return;

    const shareUrl = `${window.location.origin}?ref=${code}`;
    const shareText = `Use my referral code ${code} to get rewards on Quick Commerce! Download now: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quick Commerce Referral',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      showToast('Link copied to clipboard!', 'info');
    }
  };

  // Show login/signup prompt for unregistered users
  if (!user) {
    return (
      <div className="pb-24 md:pb-8 bg-white min-h-screen">
        <div className="bg-gradient-to-b from-green-200 via-green-100 to-white pb-6 md:pb-8 pt-12 md:pt-16">
          <div className="px-4 md:px-6 lg:px-8">
            <button onClick={() => navigate(-1)} className="mb-4 text-neutral-900" aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div className="flex flex-col items-center mb-4 md:mb-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-neutral-200 flex items-center justify-center mb-3 md:mb-4 border-2 border-white shadow-sm">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-neutral-500 md:w-12 md:h-12">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Welcome!</h1>
              <p className="text-sm md:text-base text-neutral-600 text-center px-4">
                Login to access your profile, orders, and more
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 lg:px-8 mt-6">
          <div className="max-w-md mx-auto space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-lg font-semibold text-base bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/20"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pb-24 md:pb-8 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="pb-24 md:pb-8 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-teal-600 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || 'User';
  const displayPhone = profile?.phone || user?.phone || '';
  const displayDateOfBirth = profile?.dateOfBirth;

  return (
    <div className="pb-24 md:pb-8 bg-neutral-50 min-h-screen">
      <div
        className="pb-12 md:pb-16 pt-12 md:pt-16 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${currentTheme.headerBg || '#16a34a'}22 0%, #f9fafb 100%)`
        }}
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl"
            style={{ backgroundColor: currentTheme.headerBg || '#16a34a' }}
          />
        </div>

        <div className="px-4 md:px-6 lg:px-8 relative z-10">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="mb-4 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-900 hover:bg-neutral-50 transition-colors"
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mb-4 md:mb-6"
          >
            <div className="relative mb-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white p-1 shadow-xl relative z-10">
                <div className="w-full h-full rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-100">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-neutral-400 md:w-16 md:h-16">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              {/* Decorative themed ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-4px] rounded-full opacity-30 blur-[2px]"
                style={{
                  border: `2px dashed ${currentTheme.headerBg || '#16a34a'}`,
                }}
              />
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 mb-1 tracking-tight">{displayName}</h1>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neutral-500 font-medium">
              {displayPhone && (
                <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-neutral-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-teal-600"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span>{displayPhone}</span>
                </div>
              )}
              {displayDateOfBirth && (
                <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-neutral-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-teal-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" /><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  <span>{formatDate(displayDateOfBirth)}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wallet Balance Card - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="px-4 md:px-6 lg:px-8 -mt-8 relative z-20 mb-6"
      >
        <div className="max-w-2xl md:mx-auto">
          <div
            className="rounded-3xl p-6 shadow-2xl relative overflow-hidden group border border-white/20"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.headerBg || '#0d9488'} 0%, ${currentTheme.searchBarBg || '#0f766e'} 100%)`
            }}
          >
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white md:w-9 md:h-9">
                    <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M1 10h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="18" cy="15" r="1.5" fill="white" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-white/70 font-bold uppercase tracking-widest mb-1">Your Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white/80">₹</span>
                    <span className="text-3xl md:text-4xl font-black text-white">
                      {(profile?.walletAmount || user?.walletAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/checkout')}
                  className="w-full md:w-auto px-6 py-3 bg-white text-neutral-900 rounded-2xl text-sm font-bold shadow-xl hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                  Add Money
                </motion.button>
                <p className="text-[10px] md:text-xs text-white/50 font-medium">Safe & Secure Transactions</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Invite & Earn Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-4 md:px-6 lg:px-8 mb-6"
      >
        <div className="max-w-2xl md:mx-auto">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-neutral-100 overflow-hidden relative">
            {/* Background design */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-teal-50 rounded-full blur-2xl opacity-60" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-60" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                </div>
                <h2 className="text-xl font-bold text-neutral-900">Invite & Earn</h2>
              </div>

              {!(referralStats?.isReferralApplied || profile?.isReferralApplied) ? (
                <div className="mb-6 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <p className="text-sm font-semibold text-neutral-800 mb-3">Got a Referral Code?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 uppercase font-bold"
                    />
                    <button
                      onClick={handleApplyReferral}
                      disabled={isApplyingReferral}
                      className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      {isApplyingReferral ? '...' : 'Apply'}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-2 italic">Apply once to get bonus on your first delivery!</p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-green-800">Referral Applied Successfully</h3>
                  <p className="text-xs text-green-600 mt-1">You used code: <span className="font-bold text-green-700 underline decoration-2 underline-offset-2">{referralStats?.appliedCode || 'Applied'}</span></p>
                  <p className="text-[10px] text-green-700/70 mt-3 font-medium px-4 leading-relaxed">
                    Your reward will be credited after your first successful order delivery.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Friends Joined</p>
                  <p className="text-2xl font-black text-neutral-900">{referralStats?.referralCount || 0}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Total Earnings</p>
                  <p className="text-2xl font-black text-teal-600">₹{referralStats?.referralEarnings || 0}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase tracking-wider text-teal-800/60 font-bold mb-1">Your Referral Code</p>
                  <p className="text-xl font-black text-teal-700 tracking-widest">{referralStats?.referralCode || profile?.refCode || '...'}</p>
                </div>
                <button
                  onClick={handleShareReferral}
                  className="w-full sm:w-auto px-8 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                  Share Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-4 md:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-3 gap-2 md:gap-6 max-w-2xl md:mx-auto">
          <motion.button
            whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            onClick={() => navigate('/orders')}
            className="bg-white rounded-2xl border border-neutral-100 p-3 md:p-6 shadow-sm flex flex-col items-center hover:border-teal-100 transition-all outline-none"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-2 md:mb-3 text-orange-600">
              <svg width="20" height="20" md-width="24" md-height="24" viewBox="0 0 24 24" fill="none" className="md:w-6 md:h-6"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="text-[10px] md:text-sm font-bold text-neutral-900 text-center">Your Orders</div>
            <div className="hidden md:block text-[10px] text-neutral-400 mt-1">Track & Reorder</div>
          </motion.button>

          <motion.button
            whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            onClick={() => setShowCartPreview(!showCartPreview)}
            className={`bg-white rounded-2xl border ${showCartPreview ? 'border-teal-500 bg-teal-50/30' : 'border-neutral-100'} p-3 md:p-6 shadow-sm flex flex-col items-center hover:border-teal-100 transition-all outline-none relative`}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-2 md:mb-3 text-teal-600">
              <svg width="20" height="20" md-width="24" md-height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            </div>
            {cart.items.length > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-teal-600 text-[8px] md:text-[10px] font-bold text-white ring-2 ring-white">
                {cart.items.length}
              </span>
            )}
            <div className="text-[10px] md:text-sm font-bold text-neutral-900 text-center">My Cart</div>
            <div className="hidden md:block text-[10px] text-neutral-400 mt-1">View Items</div>
          </motion.button>

          <motion.button
            whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            onClick={() => navigate('/faq')}
            className="bg-white rounded-2xl border border-neutral-100 p-3 md:p-6 shadow-sm flex flex-col items-center hover:border-teal-100 transition-all outline-none"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2 md:mb-3 text-blue-600">
              <svg width="20" height="20" md-width="24" md-height="24" viewBox="0 0 24 24" fill="none" className="md:w-6 md:h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="text-[10px] md:text-sm font-bold text-neutral-900 text-center">Need Help?</div>
            <div className="hidden md:block text-[10px] text-neutral-400 mt-1">Chat & Support</div>
          </motion.button>
        </div>
      </div>

      {/* Cart Preview Section */}
      <AnimatePresence>
        {showCartPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 md:px-6 lg:px-8 mb-6 overflow-hidden"
          >
            <div className="max-w-2xl md:mx-auto bg-white rounded-3xl p-5 shadow-xl border border-teal-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900">Items in your cart</h3>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                  Total: ₹{cart.total.toLocaleString('en-IN')}
                </span>
              </div>
              
              {loading ? (
                <div className="py-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-neutral-500">Fetching your cart items...</p>
                </div>
              ) : cart.items.length === 0 ? (
                <div className="py-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <p className="text-sm text-neutral-500 mb-3">Your cart is feeling light!</p>
                  <button onClick={() => navigate('/')} className="text-sm font-bold text-teal-600 hover:underline">Start Shopping</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {cart.items.map((item, idx) => {
                      const isCombo = !!item.comboOffer;
                      const product = isCombo ? item.comboOffer : item.product;
                      const image = isCombo ? item.comboOffer.image : item.product?.imageUrl;
                      const name = isCombo ? item.comboOffer.name : item.product?.name;
                      const price = isCombo ? item.comboOffer.comboPrice : (item.product?.price || 0);

                      return (
                        <div key={item.id || item._id || idx} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div className="w-12 h-12 rounded-lg bg-white border border-neutral-200 flex-shrink-0 overflow-hidden">
                            {image ? (
                              <img src={image} alt={name} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m6-18v18"/></svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-neutral-900 truncate">{name}</p>
                            <p className="text-[10px] text-neutral-500">{item.quantity} x ₹{price.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="text-xs font-bold text-neutral-900">
                            ₹{(item.quantity * price).toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => navigate('/cart')}
                    className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-teal-700 transition-colors mt-2"
                  >
                    Go to Checkout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-2 max-w-2xl md:mx-auto">
        <h2 className="text-xs font-black text-neutral-400 mb-4 uppercase tracking-[0.2em] px-1">Settings & Info</h2>
        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden mb-8">
          {[
            { id: 'address', label: 'Address Book', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, action: () => navigate('/address-book'), color: 'text-indigo-500' },
            { id: 'wishlist', label: 'Your Wishlist', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, action: () => navigate('/wishlist'), color: 'text-rose-500' },
            { id: 'spin-wheel', label: 'Spin & Win', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>, action: () => navigate('/spin-wheel'), color: 'text-teal-600' },
            { id: 'plans', label: 'Plans', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5v-13A2.5 2.5 0 0 0 17.5 4h-11A2.5 2.5 0 0 0 4 6.5v13z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 11h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, action: () => navigate('/plans'), color: 'text-emerald-600' },
            { id: 'gst', label: 'GST Details', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, action: () => setShowGstModal(true), color: 'text-amber-500' },
            { id: 'clean', label: 'Deep Clean Cart', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 6L5 20M5 6l14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, action: () => {
              if (confirm('This will wipe all items from your cart and reset it. Continue?')) {
                localStorage.removeItem('saved_cart');
                clearCart();
                alert('Cart cleaned successfully!');
              }
            }, color: 'text-red-500', isCritical: true },
            { id: 'about', label: 'About Us', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" strokeWidth="2" /></svg>, action: () => window.location.href = 'https://about.dhakadsnazzy.com', color: 'text-sky-500' },
            { id: 'lucky-spin', label: 'Spin & Win', icon: <span className="text-lg">🎁</span>, action: () => triggerSpinner('manual'), color: 'text-purple-500 font-bold' },
            { id: 'logout', label: 'Log Out', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>, action: handleLogout, color: 'text-red-500', isCritical: true },
          ].map((item, idx) => (
            <motion.button
              key={item.id}
              whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
              onClick={item.action}
              className={`w-full flex items-center justify-between px-5 py-4 transition-colors group ${idx !== 0 ? 'border-t border-neutral-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.isCritical ? 'bg-red-50 text-red-500' : 'bg-neutral-50 ' + item.color} group-hover:scale-110 transition-transform duration-300`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">{item.icon}</svg>
                </div>
                <span className={`text-sm font-bold ${item.isCritical ? 'text-red-600' : 'text-neutral-800'}`}>{item.label}</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-300 group-hover:text-neutral-500 transition-colors"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </motion.button>
          ))}
        </div>
      </div>

      {showGstModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowGstModal(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-500 ease-out">
            <div className="bg-white rounded-t-[32px] shadow-2xl max-w-lg mx-auto p-6 pt-10 relative">
              <button onClick={() => setShowGstModal(false)} className="absolute -top-12 right-4 w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <div className="text-center">
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="3" width="14" height="18" rx="2" ry="2" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" /></svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Add GST Details</h3>
                <p className="text-[13px] text-neutral-500 mb-8 px-4">Identify your business to get a GST invoice on your business purchases.</p>
                <form onSubmit={handleGstSubmit} className="space-y-4">
                  <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="Enter GST Number" className="w-full rounded-xl border border-neutral-200 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
                  <button type="submit" disabled={!gstNumber.trim()} className="w-full rounded-xl bg-teal-600 text-white font-bold py-4 hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-lg shadow-teal-500/20 uppercase tracking-wider text-sm">Save Details</button>
                </form>
                <p className="mt-6 text-[11px] text-neutral-400">By continuing, you agree to our <span className="underline">Terms & Conditions</span></p>
              </div>
            </div>
          </div>
        </>
      )}
      <LuckySpin 
        isOpen={showLuckySpin} 
        onClose={() => setShowLuckySpin(false)} 
        config={spinnerConfig}
      />
    </div>
  );
}
