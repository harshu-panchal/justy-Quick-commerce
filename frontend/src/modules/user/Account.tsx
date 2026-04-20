import { useNavigate, Link } from 'react-router-dom';
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
import { getCustomerCoinBalance, convertCustomerCoins } from '../../services/api/customerSpinWheelService';
import jyastiLogo from '@assets/jyastiLogo.png';

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
  const [coinBalance, setCoinBalance] = useState(0);
  const [convertAmount, setConvertAmount] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [showCoinConvert, setShowCoinConvert] = useState(false);
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
          fetchReferralStats();
          const pendingCode = localStorage.getItem('pendingReferralCode');
          if (pendingCode && !response.data.isReferralApplied) {
            setReferralInput(pendingCode);
          }
        } else {
          setError('Failed to load profile');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
        if (err.response?.status === 401) authLogout();
      } finally {
        setLoading(false);
      }
    };

    const fetchReferralStats = async () => {
      try {
        const response = await getReferralStats();
        if (response.success) setReferralStats(response.data);
      } catch (err) {
        console.error('Failed to fetch referral stats', err);
      }
    };

    const fetchSpinnerSettings = async () => {
      try {
        const response = await getPublicSpinnerSettings();
        if (response.success) setSpinnerSettings(response.data);
      } catch (err) {
        console.error('Failed to fetch spinner settings', err);
      }
    };

    const fetchCoinBalance = async () => {
      try {
        const res = await getCustomerCoinBalance();
        if (res.success && res.data) setCoinBalance(res.data.coinBalance);
      } catch {}
    };

    if (user) {
      fetchProfile();
      fetchSpinnerSettings();
      fetchCoinBalance();
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
    if (!referralInput.trim()) { showToast('Please enter a referral code', 'error'); return; }
    try {
      setIsApplyingReferral(true);
      const response = await applyReferralCode(referralInput.trim());
      if (response.success) {
        showToast(response.message || 'Referral code applied successfully!', 'success');
        localStorage.removeItem('pendingReferralCode');
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

  const handleConvertCoins = async () => {
    const coins = Number(convertAmount);
    if (!coins || coins < 10 || coins % 10 !== 0) { showToast('Enter a valid amount (minimum 10 coins, multiples of 10)', 'error'); return; }
    if (coins > coinBalance) { showToast('Insufficient coin balance', 'error'); return; }
    try {
      setIsConverting(true);
      const res = await convertCustomerCoins(coins);
      if (res.success && res.data) {
        setCoinBalance(res.data.coinBalance);
        setProfile(prev => prev ? { ...prev, walletAmount: res.data!.walletBalance } : prev);
        showToast(res.message || `₹${res.data.rupeesEarned} added to wallet!`, 'success');
        setConvertAmount('');
        setShowCoinConvert(false);
      } else {
        showToast(res.message || 'Conversion failed', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Conversion failed', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  const handleShareReferral = async () => {
    const code = referralStats?.referralCode || profile?.refCode;
    if (!code) return;
    const shareUrl = `${window.location.origin}?ref=${code}`;
    const shareText = `Use my referral code ${code} to get rewards on Quick Commerce! Download now: ${shareUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Quick Commerce Referral', text: shareText, url: shareUrl }); }
      catch (err) { console.log('Error sharing', err); }
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Link copied to clipboard!', 'info');
    }
  };

  const accentColor = currentTheme.headerBg || '#0d9488';

  const menuItems = [
    { id: 'orders', label: 'Your Orders', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>, action: () => navigate('/orders'), color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'cart', label: 'My Cart', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>, action: () => navigate('/cart'), color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'address', label: 'Address Book', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>, action: () => navigate('/address-book'), color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'wishlist', label: 'Your Wishlist', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>, action: () => navigate('/wishlist'), color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'spin-wheel', label: 'Spin & Win', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>, action: () => navigate('/spin-wheel'), color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'plans', label: 'Plans', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22h11A2.5 2.5 0 0 0 20 19.5v-13A2.5 2.5 0 0 0 17.5 4h-11A2.5 2.5 0 0 0 4 6.5v13z" /><path d="M8 7h8M8 11h8M8 15h5" /></svg>, action: () => navigate('/plans'), color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'gst', label: 'GST Details', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>, action: () => setShowGstModal(true), color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'contact', label: 'Contact Us', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>, action: () => navigate('/contact-us'), color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'about', label: 'About Us', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>, action: () => navigate('/about-us'), color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: 'privacy', label: 'Privacy Policy', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, action: () => navigate('/privacy-policy'), color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'refund', label: 'Refund Policy', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, action: () => navigate('/refund-policy'), color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'terms', label: 'Terms & Conditions', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>, action: () => navigate('/terms-and-conditions'), color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'clean', label: 'Clear Cart', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>, action: () => { if (confirm('Clear your cart?')) { localStorage.removeItem('saved_cart'); clearCart(); showToast('Cart cleared!', 'success'); } }, color: 'text-red-500', bg: 'bg-red-50', isCritical: true },
    { id: 'logout', label: 'Log Out', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>, action: handleLogout, color: 'text-red-500', bg: 'bg-red-50', isCritical: true },
  ];

  // — Guest View —
  if (!user) {
    const benefits = [
      { icon: '📦', title: 'Track Orders', desc: 'Real-time order tracking & history' },
      { icon: '⚡', title: '10-Min Delivery', desc: 'Ultra-fast delivery to your door' },
      { icon: '🪙', title: 'Earn Coins', desc: 'Spin & win rewards on every order' },
      { icon: '🎁', title: 'Referral Bonus', desc: 'Invite friends & earn together' },
    ];
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: `linear-gradient(165deg, ${accentColor}18 0%, #f0fdf4 40%, #f9fafb 100%)` }}>
        {/* Hero Section */}
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-white/5" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 pt-14 pb-12">
            {/* Avatar placeholder */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative mb-5"
            >
              <div className="w-22 h-22 w-[88px] h-[88px] rounded-full bg-white/15 border-2 border-white/30 backdrop-blur-sm flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-[-4px] rounded-full border-2 border-dashed border-white/25 pointer-events-none"
              />
            </motion.div>

            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
              <h1 className="text-2xl font-extrabold text-white mb-1.5 tracking-tight">Welcome Back!</h1>
              <p className="text-sm text-white/70 font-medium">Sign in to unlock the full experience</p>
            </motion.div>

            {/* Delivery badge */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="mt-4 flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-3.5 py-2 rounded-full">
              <span className="text-sm">⚡</span>
              <span className="text-xs font-bold text-white">Delivery in 10–15 minutes</span>
            </motion.div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-3 text-center">Why Join?</p>
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-3.5 flex flex-col gap-1.5"
              >
                <span className="text-xl">{b.icon}</span>
                <p className="text-[12px] font-bold text-neutral-900">{b.title}</p>
                <p className="text-[10px] text-neutral-400 leading-snug">{b.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-2.5">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
              Login / Sign Up
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-2xl font-semibold text-sm border border-neutral-200 bg-white text-neutral-600 active:scale-95 transition-transform"
            >
              Browse as Guest
            </button>
          </motion.div>

          <p className="text-center text-[10px] text-neutral-400 mt-4 px-4">
            By continuing, you agree to our{' '}
            <button onClick={() => navigate('/terms-and-conditions')} className="underline font-medium">Terms</button>
            {' '}&{' '}
            <button onClick={() => navigate('/privacy-policy')} className="underline font-medium">Privacy Policy</button>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: `${accentColor}44`, borderTopColor: 'transparent' }} />
          <p className="text-sm text-neutral-400 font-medium">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-medium">{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl text-white font-bold" style={{ background: accentColor }}>Go Back</button>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || 'User';
  const displayPhone = profile?.phone || user?.phone || '';
  const displayDateOfBirth = profile?.dateOfBirth;
  const walletAmount = (profile?.walletAmount || user?.walletAmount || 0);

  // ─── Desktop Sidebar ───────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-neutral-100 min-h-screen sticky top-0 shrink-0">
      <div className="px-5 py-5 flex flex-col items-center border-b border-neutral-100">
        <Link to="/">
          <img src={jyastiLogo} alt="Jyasti" className="h-16 w-auto object-contain" />
        </Link>
      </div>

      {/* Mini profile in sidebar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-50">
        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-neutral-900 truncate">{displayName}</p>
          <p className="text-[11px] text-neutral-400 truncate">{displayPhone}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {menuItems.map((item) => (
          <button key={item.id} onClick={item.action} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${item.isCritical ? 'hover:bg-red-50' : 'hover:bg-neutral-50'}`}>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg} ${item.color} transition-transform group-hover:scale-105`}>
              {item.icon}
            </span>
            <span className={`text-[13px] font-semibold ${item.isCritical ? 'text-red-600' : 'text-neutral-700'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-50">
        <button onClick={() => navigate('/faq')} className="w-full py-2 rounded-xl text-xs font-bold text-center border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors">
          Visit Support Center
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50 font-outfit overflow-x-hidden">
      <Sidebar />

      {/* ─── Main Content ─── */}
      <div className="flex-1 min-w-0 pb-28 md:pb-10">

        {/* ── Profile Header ── */}
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${accentColor}25 0%, ${accentColor}05 60%, #f9fafb 100%)` }}>
          {/* Back button mobile only */}
          <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          <div className="flex flex-col items-center pt-8 pb-5 px-4">
            {/* Avatar */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-white shadow-lg border-2 flex items-center justify-center" style={{ borderColor: `${accentColor}40` }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-neutral-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-[-3px] rounded-full border-2 border-dashed opacity-30 pointer-events-none"
                style={{ borderColor: accentColor }}
              />
            </div>

            <h1 className="text-lg font-extrabold text-neutral-900 tracking-tight">{displayName}</h1>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
              {displayPhone && (
                <span className="flex items-center gap-1 text-[11px] bg-white border border-neutral-100 shadow-sm px-2.5 py-1 rounded-full text-neutral-500 font-medium">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-teal-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {displayPhone}
                </span>
              )}
              {displayDateOfBirth && (
                <span className="flex items-center gap-1 text-[11px] bg-white border border-neutral-100 shadow-sm px-2.5 py-1 rounded-full text-neutral-500 font-medium">
                  🎂 {formatDate(displayDateOfBirth)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Cards Container ── */}
        <div className="px-3 sm:px-4 md:px-6 space-y-3 -mt-2 max-w-2xl mx-auto w-full">

          {/* ── Wallet Card ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="rounded-2xl overflow-hidden shadow-md relative" style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                        <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M1 10h22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="18" cy="15" r="1.5" fill="white" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/65 font-bold uppercase tracking-widest">Your Balance</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-bold text-white/80">₹</span>
                        <span className="text-2xl font-black text-white leading-tight">{walletAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => navigate('/checkout')}
                      className="px-4 py-2 bg-white text-neutral-900 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14" /></svg>
                      Add Money
                    </button>
                    <p className="text-[9px] text-white/40 font-medium">Safe & Secure</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Coin Balance Card ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-xl shrink-0">🪙</div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Coins</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-amber-600">{coinBalance.toLocaleString()}</span>
                        <span className="text-[10px] text-amber-500 font-bold">coins</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-amber-600/70 font-medium">10 coins = ₹1</p>
                    <p className="text-sm font-black text-amber-700">≈ ₹{(coinBalance / 10).toFixed(1)}</p>
                  </div>
                </div>

                {coinBalance >= 10 ? (
                  <button
                    onClick={() => setShowCoinConvert(v => !v)}
                    className="w-full py-2 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
                  >
                    💸 Convert to Wallet
                    <svg className={`w-3.5 h-3.5 transition-transform ${showCoinConvert ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                ) : (
                  <p className="text-center text-[11px] text-amber-600/60 py-1 font-medium">Spin & win to earn coins! (Min 10 to convert)</p>
                )}

                <AnimatePresence>
                  {showCoinConvert && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-3 bg-white/60 rounded-xl p-3 border border-amber-100">
                        <p className="text-[11px] text-amber-700 font-bold mb-2">Enter coins (multiples of 10)</p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={convertAmount}
                            onChange={e => setConvertAmount(e.target.value)}
                            placeholder={`Max ${coinBalance}`}
                            min={10} max={coinBalance} step={10}
                            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-amber-200 text-sm font-bold text-amber-900 bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                          />
                          <button onClick={handleConvertCoins} disabled={isConverting} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold disabled:opacity-50 active:scale-95 transition-transform">
                            {isConverting ? '…' : 'Go'}
                          </button>
                        </div>
                        {convertAmount && Number(convertAmount) >= 10 && Number(convertAmount) % 10 === 0 && (
                          <p className="mt-1.5 text-[11px] text-green-600 font-bold">= ₹{(Number(convertAmount) / 10).toFixed(0)} to wallet</p>
                        )}
                        <div className="mt-2 flex gap-1.5 flex-wrap">
                          {[10, 20, 50, 100].filter(v => v <= coinBalance).map(v => (
                            <button key={v} onClick={() => setConvertAmount(String(v))} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 active:scale-95">{v}🪙</button>
                          ))}
                          {coinBalance >= 10 && (
                            <button onClick={() => setConvertAmount(String(Math.floor(coinBalance / 10) * 10))} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 active:scale-95">All</button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Orders', icon: '📦', bg: 'bg-orange-50 border-orange-100', text: 'text-orange-600', action: () => navigate('/orders') },
                { label: 'Cart', icon: '🛒', bg: 'bg-teal-50 border-teal-100', text: 'text-teal-600', badge: cart.items.length, action: () => setShowCartPreview(v => !v) },
                { label: 'Help', icon: '💬', bg: 'bg-blue-50 border-blue-100', text: 'text-blue-600', action: () => navigate('/faq') },
              ].map((item) => (
                <button key={item.label} onClick={item.action} className={`relative ${item.bg} border rounded-xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform`}>
                  <span className="text-xl">{item.icon}</span>
                  <span className={`text-[11px] font-bold ${item.text}`}>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-teal-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-1 ring-white">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Cart Preview ── */}
          <AnimatePresence>
            {showCartPreview && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-neutral-900">Cart Items</h3>
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">₹{cart.total.toLocaleString('en-IN')}</span>
                  </div>
                  {cart.items.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-neutral-400 mb-3">Your cart is empty</p>
                      <button onClick={() => navigate('/')} className="text-sm font-bold" style={{ color: accentColor }}>Start Shopping</button>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {cart.items.map((item, idx) => {
                          const isCombo = !!item.comboOffer;
                          const image = isCombo ? item.comboOffer.image : item.product?.imageUrl;
                          const name = isCombo ? item.comboOffer.name : item.product?.name;
                          const price = isCombo ? item.comboOffer.comboPrice : (item.product?.price || 0);
                          return (
                            <div key={item.id || item._id || idx} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl">
                              <div className="w-10 h-10 rounded-lg bg-white border border-neutral-100 flex-shrink-0 overflow-hidden">
                                {image ? <img src={image} alt={name} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-neutral-300 text-lg">📦</div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-neutral-900 truncate">{name}</p>
                                <p className="text-[10px] text-neutral-400">{item.quantity} × ₹{price}</p>
                              </div>
                              <span className="text-xs font-bold text-neutral-700 shrink-0">₹{(item.quantity * price).toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => navigate('/cart')} className="w-full mt-3 py-2.5 rounded-xl text-white text-sm font-bold active:scale-95 transition-transform" style={{ background: accentColor }}>
                        Go to Checkout
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Invite & Earn ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                  </div>
                  <h2 className="text-sm font-bold text-neutral-900">Invite & Earn</h2>
                </div>

                {/* Referral Input / Applied Badge */}
                {!(referralStats?.isReferralApplied || profile?.isReferralApplied) ? (
                  <div className="mb-3 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                    <p className="text-[11px] font-semibold text-neutral-700 mb-2">Have a referral code?</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={referralInput}
                        onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-neutral-200 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:border-teal-500 transition-all"
                        style={{ '--tw-ring-color': `${accentColor}33` } as any}
                      />
                      <button onClick={handleApplyReferral} disabled={isApplyingReferral} className="px-4 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50 active:scale-95 transition-transform shrink-0" style={{ background: accentColor }}>
                        {isApplyingReferral ? '…' : 'Apply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 bg-green-50 rounded-xl p-3 border border-green-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-green-800">Referral Applied!</p>
                      <p className="text-[10px] text-green-600">Code: <span className="font-bold">{referralStats?.appliedCode || 'Applied'}</span></p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold mb-0.5">Friends Joined</p>
                    <p className="text-xl font-black text-neutral-900">{referralStats?.referralCount || 0}</p>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold mb-0.5">Earnings</p>
                    <p className="text-xl font-black" style={{ color: accentColor }}>₹{referralStats?.referralEarnings || 0}</p>
                  </div>
                </div>

                {/* Share Code */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border" style={{ background: `${accentColor}0a`, borderColor: `${accentColor}20` }}>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wider font-bold opacity-60" style={{ color: accentColor }}>Your Code</p>
                    <p className="text-base font-black tracking-widest truncate" style={{ color: accentColor }}>{referralStats?.referralCode || profile?.refCode || '—'}</p>
                  </div>
                  <button onClick={handleShareReferral} className="px-4 py-2 rounded-xl text-white text-xs font-bold active:scale-95 transition-transform shrink-0 flex items-center gap-1.5" style={{ background: accentColor }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Menu Items (Mobile only) ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="md:hidden">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1 mb-2">Settings & Info</p>
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              {menuItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors group ${idx !== 0 ? 'border-t border-neutral-50' : ''} ${item.isCritical ? 'hover:bg-red-50' : 'hover:bg-neutral-50/80'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color} transition-transform group-active:scale-90`}>
                      {item.icon}
                    </span>
                    <span className={`text-[13px] font-semibold truncate ${item.isCritical ? 'text-red-500' : 'text-neutral-800'}`}>{item.label}</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-300 shrink-0 ml-2"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </div>

      {/* ── GST Modal ── */}
      {showGstModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowGstModal(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto">
            <div className="bg-white rounded-t-3xl shadow-2xl px-5 pt-8 pb-10">
              <button onClick={() => setShowGstModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">GST Details</h3>
              <p className="text-xs text-neutral-500 mb-5">Add your GSTIN to get GST invoices on purchases.</p>
              <form onSubmit={handleGstSubmit} className="space-y-3">
                <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="Enter GST Number" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-teal-500 transition-all" />
                <button type="submit" disabled={!gstNumber.trim()} className="w-full rounded-xl text-white font-bold py-3.5 disabled:opacity-50 transition-colors text-sm" style={{ background: accentColor }}>Save Details</button>
              </form>
            </div>
          </div>
        </>
      )}

      <LuckySpin isOpen={showLuckySpin} onClose={() => setShowLuckySpin(false)} config={spinnerConfig} />
    </div>
  );
}
