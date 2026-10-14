import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  LogOut, 
  Briefcase, 
  ChevronRight,
  Info,
  Headphones,
  FileText,
  ShieldCheck,
  Edit2,
  Check,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfileDrawerModal({ 
  isOpen, 
  onClose, 
  onLogoutComplete, 
  onOpenWorkerOnboarding,
  onOpenAuth 
}) {
  const { currentUser, updateUserProfile, logout, loginWithPhone, checkPhoneRegistered } = useAuth();
  
  // Navigation inside drawer: 'main' | 'about' | 'contact' | 'terms' | 'login_phone' | 'login_otp' | 'login_name'
  const [activeSubView, setActiveSubView] = useState('main');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Inline OTP Auth state for guest users
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('123456');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [existingUserFound, setExistingUserFound] = useState(null);

  const isLoggedIn = Boolean(currentUser && currentUser.uid);

  // Sync edit form fields whenever drawer opens or user changes
  useEffect(() => {
    if (isOpen) {
      setActiveSubView('main');
      setIsEditing(false);
      setSaveSuccess(false);
      setAuthError('');
      
      if (isLoggedIn) {
        setEditName(currentUser?.name || '');
        setEditEmail(currentUser?.email || '');
        setEditAddress(currentUser?.city || currentUser?.address || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala');
      } else {
        // Pure unauthenticated state: zero cached fake data
        setEditName('');
        setEditEmail('');
        setEditAddress('');
        setPhoneInput('');
        setOtpInput('123456');
        setNameInput('');
        setExistingUserFound(null);
      }
    }
  }, [isOpen, isLoggedIn, currentUser]);

  if (!isOpen) return null;

  // Pure Logout Action: Clears active user session & tokens, closes drawer instantly
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      onLogoutComplete?.();
    } catch (err) {
      console.warn('Logout error', err);
      onClose();
      onLogoutComplete?.();
    }
  };

  // Save profile updates
  const handleSaveProfile = async (e) => {
    e?.preventDefault?.();
    if (!editName.trim()) return;
    setSavingProfile(true);
    try {
      await updateUserProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        city: editAddress.trim(),
        address: editAddress.trim()
      });
      if (editAddress.trim()) {
        localStorage.setItem('jobit_user_location', editAddress.trim());
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.warn('Failed to save profile', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Inline Mobile Number + OTP Flow
  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    const cleanTen = phoneInput.replace(/\D/g, '').slice(-10);
    if (!cleanTen || cleanTen.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      if (cleanTen === '8289968045') {
        setExistingUserFound({ name: 'Master Admin', role: 'admin' });
      } else {
        const regStatus = await checkPhoneRegistered?.(cleanTen);
        if (regStatus?.isRegistered && regStatus?.user) {
          setExistingUserFound(regStatus.user);
        } else {
          setExistingUserFound(null);
        }
      }
      setActiveSubView('login_otp');
    } catch {
      setActiveSubView('login_otp');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault?.();
    const cleanTen = phoneInput.replace(/\D/g, '').slice(-10);
    if (!otpInput || otpInput.length < 4) {
      setAuthError('Please enter verification code (Mock OTP: 123456)');
      return;
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      // Admin phone check
      if (cleanTen === '8289968045') {
        await loginWithPhone('8289968045', otpInput, 'Master Admin', 'admin');
        setActiveSubView('main');
        return;
      }

      // Existing single account rule
      if (existingUserFound) {
        await loginWithPhone(cleanTen, otpInput, existingUserFound.name, existingUserFound.role || 'customer');
        setActiveSubView('main');
        return;
      }

      // Brand new user registration
      setActiveSubView('login_name');
    } catch (err) {
      setAuthError(err.message || 'OTP verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFinishNewUser = async (e) => {
    e?.preventDefault?.();
    const cleanTen = phoneInput.replace(/\D/g, '').slice(-10);
    const finalName = nameInput.trim() || 'JOBit Customer';
    setAuthLoading(true);
    setAuthError('');

    try {
      await loginWithPhone(cleanTen, otpInput, finalName, 'customer');
      setActiveSubView('main');
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const displayName = currentUser?.name || '';
  const displayPhone = currentUser?.phone || '';
  const displayEmail = currentUser?.email || '';
  const displayAddress = currentUser?.city || currentUser?.address || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala';
  const userPhoto = currentUser?.photo || currentUser?.avatar;

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in select-none">
      
      {/* Primary Light Blue Slide-out Drawer Panel (Docked to Left Edge) */}
      <div 
        className="w-full max-w-[360px] sm:max-w-[380px] h-full bg-[#E9F8FD] text-slate-900 flex flex-col shadow-2xl relative border-r border-[#D0EEF9] overflow-hidden animate-slide-from-left z-10"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ======================================================== */}
        {/* TOP LIGHT BLUE THEMED DRAWER HEADER                      */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-b from-[#D8F3FC] via-[#E4F7FD] to-[#E9F8FD] px-6 pt-5 pb-5 border-b border-[#D0EEF9] shrink-0 relative">
          
          {/* Header Action Bar */}
          <div className="flex items-center justify-between mb-4">
            {activeSubView !== 'main' ? (
              <button
                type="button"
                onClick={() => setActiveSubView('main')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#0EA5E0]" />
                <span>Back</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E0] shadow-[0_0_8px_#0EA5E0]" />
                <span className="text-xs font-black tracking-widest text-[#0EA5E0] uppercase">JOBit Account</span>
              </div>
            )}

            {/* Close Drawer Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shadow-xs border border-slate-200/80"
              title="Close Drawer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* ======================================================== */}
          {/* TOP PROFILE INFO (PLAIN HIGH-CONTRAST LAYOUT)            */}
          {/* ======================================================== */}
          {isLoggedIn ? (
            <div className="flex items-start gap-4">
              {/* Profile Avatar with Cyan Accent Ring */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-white ring-2 ring-[#0EA5E0] flex items-center justify-center overflow-hidden shadow-sm">
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-[#0EA5E0]">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 ring-2 ring-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs" title="Verified Single Account">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* User Identity Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                  {displayName}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#0EA5E0] shrink-0" />
                  <span>{displayPhone}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#D0EEF9] text-[#0EA5E0] text-[10px] font-black shadow-xs">
                  <span>{currentUser?.role === 'admin' ? 'Admin Profile' : (currentUser?.role === 'worker' ? 'Verified Pro' : 'Customer Account')}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Unauthenticated Guest Header */
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white ring-2 ring-[#0EA5E0] flex items-center justify-center text-[#0EA5E0] shrink-0 shadow-sm">
                <User className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Guest Account
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                  Sign in with your mobile number to view and manage service bookings.
                </p>
              </div>
            </div>
          )}

          {/* Guest Login / Sign Up Trigger */}
          {!isLoggedIn && activeSubView === 'main' && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setActiveSubView('login_phone')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0EA5E0] to-[#4B6EF5] hover:opacity-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Login / Sign Up</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SCROLLABLE DRAWER BODY CONTENT                           */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 no-scrollbar">

          {/* MAIN VIEW: PROFILE DETAILS & 3 PLAIN LIST BUTTONS */}
          {activeSubView === 'main' && (
            <>
              {/* Authenticated: Plain Layout Top Profile Information */}
              {isLoggedIn && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Personal Details
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs font-bold text-[#0EA5E0] hover:text-[#0284C7] flex items-center gap-1 cursor-pointer transition active:scale-95"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                    </button>
                  </div>

                  {saveSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Details saved successfully!</span>
                    </div>
                  )}

                  {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-2.5 pt-1">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-600 block mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0] shadow-xs transition"
                          placeholder="Your Name"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-600 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0] shadow-xs transition"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold text-slate-600 block mb-1">Primary Address / Location</label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0] shadow-xs transition"
                          placeholder="Melattur, Kerala"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="w-full py-2.5 rounded-xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{savingProfile ? 'Saving...' : 'Save Profile Details'}</span>
                      </button>
                    </form>
                  ) : (
                    /* Plain text profile rows */
                    <div className="space-y-2">
                      {/* Name */}
                      <div className="p-3 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#E9F8FD] text-[#0EA5E0] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Name</p>
                          <p className="text-xs font-extrabold text-slate-900 truncate">{displayName || 'Customer'}</p>
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="p-3 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#E9F8FD] text-[#0EA5E0] flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</p>
                          <p className="text-xs font-extrabold text-slate-900 truncate">{displayPhone || 'Not set'}</p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="p-3 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#E9F8FD] text-[#0EA5E0] flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                          <p className="text-xs font-extrabold text-slate-900 truncate">{displayEmail || 'Not provided'}</p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="p-3 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#E9F8FD] text-[#0EA5E0] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Primary Address</p>
                          <p className="text-xs font-extrabold text-slate-900 truncate">{displayAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* 3 PLAIN TEXT BUTTON LINKS (VERTICAL LIST)                */}
              {/* ======================================================== */}
              <div className="space-y-2 pt-2 border-t border-[#D0EEF9]">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Explore & Support
                </h4>

                {/* 1. About Us */}
                <button
                  type="button"
                  onClick={() => setActiveSubView('about')}
                  className="w-full py-3 px-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#D0EEF9] text-slate-900 shadow-xs transition flex items-center justify-between text-left cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F7FA] text-[#00A3E0] flex items-center justify-center shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">About Us</p>
                      <p className="text-[10px] text-slate-500 font-medium">App overview & Melattur service platform</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 2. Contact Us */}
                <button
                  type="button"
                  onClick={() => setActiveSubView('contact')}
                  className="w-full py-3 px-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#D0EEF9] text-slate-900 shadow-xs transition flex items-center justify-between text-left cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F7FA] text-[#00A3E0] flex items-center justify-center shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Contact Us</p>
                      <p className="text-[10px] text-slate-500 font-medium">Support desk, phone & WhatsApp help</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* 3. Privacy Policy & Terms */}
                <button
                  type="button"
                  onClick={() => setActiveSubView('terms')}
                  className="w-full py-3 px-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#D0EEF9] text-slate-900 shadow-xs transition flex items-center justify-between text-left cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F7FA] text-[#00A3E0] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Privacy Policy & Terms</p>
                      <p className="text-[10px] text-slate-500 font-medium">App guidelines & policies</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* ======================================================== */}
              {/* PROFESSIONAL / PRO SWITCH DEDICATED OPTION               */}
              {/* ======================================================== */}
              <div className="pt-2 border-t border-[#D0EEF9]">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWorkerOnboarding?.();
                  }}
                  className="w-full p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-emerald-300 text-left transition cursor-pointer active:scale-98 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Switch to Pro / Become a Professional</p>
                      <p className="text-[10px] text-emerald-700 font-bold">Register as service worker & manage jobs</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-500" />
                </button>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* SUB-VIEW: 1. ABOUT US                                    */}
          {/* ======================================================== */}
          {activeSubView === 'about' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900">About JOBit Melattur</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  JOBit is Melattur's premier on-demand hyperlocal home services platform. We bridge local households with thoroughly background-verified professionals across Malappuram district.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs">
                  <p className="text-xs font-extrabold text-slate-900">Flat ₹99 Advance Inspection</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Transparent, fixed inspection advance booking with zero hidden platform markups.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs">
                  <p className="text-xs font-extrabold text-slate-900">20+ Local Home Trades</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Electricians, Plumbers, AC mechanics, Coconut Tree Climbers, Domestic Help, Cleaning, and more.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs">
                  <p className="text-xs font-extrabold text-slate-900">Verified Local Technicians</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Every registered technician is KYC-verified with localized dispatch and live phone support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-VIEW: 2. CONTACT US                                  */}
          {/* ======================================================== */}
          {activeSubView === 'contact' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900">Contact & Help Desk</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  Need assistance with your booking or technician dispatch? Reach our team anytime via WhatsApp or email.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* WhatsApp Support Button */}
                <a
                  href="https://wa.me/918289968045?text=Hello%20JOBit%20Support"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#D0EEF9] shadow-xs flex items-center justify-between text-left transition group cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">WhatsApp Support</p>
                      <p className="text-[11px] text-slate-600 font-bold">+91 8289968045</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-lg">Chat Now</span>
                </a>

                {/* Direct Phone Support Button */}
                <a
                  href="tel:+918289968045"
                  className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#D0EEF9] shadow-xs flex items-center justify-between text-left transition group cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F7FA] text-[#00A3E0] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Direct Phone Support</p>
                      <p className="text-[11px] text-slate-600 font-bold">+91 8289968045</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#0EA5E0] font-black uppercase tracking-wider bg-sky-50 px-2 py-1 rounded-lg">Call Now</span>
                </a>

                {/* Official Email Link */}
                <a
                  href="mailto:teamjobit@gmail.com"
                  className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-[#D0EEF9] shadow-xs flex items-center justify-between text-left transition group cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E0F7FA] text-[#00A3E0] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Official Email</p>
                      <p className="text-[11px] text-slate-600 font-semibold">teamjobit@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#0EA5E0] font-black uppercase tracking-wider bg-sky-50 px-2 py-1 rounded-lg">Send Email</span>
                </a>

                {/* Office Info */}
                <div className="p-3 rounded-2xl bg-slate-100/60 border border-slate-200/50 text-slate-500 text-[11px] text-center font-medium">
                  Operational Hours: 8:00 AM – 8:00 PM (Daily)
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-VIEW: 3. PRIVACY POLICY & TERMS                      */}
          {/* ======================================================== */}
          {activeSubView === 'terms' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900">Privacy Policy</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  Our official privacy policies, cookie disclosure, and data protection practices.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Cookie & Service Functionality */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs space-y-1">
                  <p className="font-extrabold text-slate-900 text-xs">Cookie & Service Functionality</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Disabling cookies may disable some actions that make your app/site experience more efficient, and some of our services may not function optimally. However, you will still be able to place orders and book services.
                  </p>
                </div>

                {/* Third-Party Disclosure */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs space-y-1">
                  <p className="font-extrabold text-slate-900 text-xs">Third-Party Disclosure</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    We do not sell, trade, or otherwise transfer your Personally Identifiable Information to outside parties.
                  </p>
                </div>

                {/* Third-Party Links */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs space-y-1">
                  <p className="font-extrabold text-slate-900 text-xs">Third-Party Links</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    We do not include or offer third-party products or services through any external links on our platform.
                  </p>
                </div>

                {/* Do Not Track (DNT) Signals */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs space-y-1">
                  <p className="font-extrabold text-slate-900 text-xs">Do Not Track (DNT) Signals</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    We honor Do Not Track signals and do not track, plant cookies, or use advertising when a Do Not Track (DNT) browser mechanism is in place.
                  </p>
                </div>

                {/* Third-Party Behavioral Tracking */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs space-y-1">
                  <p className="font-extrabold text-slate-900 text-xs">Third-Party Behavioral Tracking</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    We do not allow third-party behavioral tracking on our platform.
                  </p>
                </div>

                {/* Fair Information Practices & Data Breach Response */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#D0EEF9] shadow-xs space-y-1">
                  <p className="font-extrabold text-slate-900 text-xs">Fair Information Practices & Data Breach Response</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Should a data breach occur, we will notify users via email/phone within 1 business day, and via in-app notifications within 1 business day. We adhere to the individual redress principle, giving users legally enforceable rights regarding their personal data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* INLINE OTP AUTH STEP 1: MOBILE NUMBER                    */}
          {/* ======================================================== */}
          {activeSubView === 'login_phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4 pt-1">
              <div>
                <h4 className="text-sm font-black text-slate-900">Enter Mobile Number</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  We'll send an OTP to verify your account
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">10-Digit Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    autoFocus
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value.replace(/\D/g, '').slice(-10));
                      setAuthError('');
                    }}
                    placeholder="98765 00001"
                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0] shadow-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Strict 1 account per mobile number policy</p>
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E0] to-[#4B6EF5] text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
              >
                <span>{authLoading ? 'Checking Number...' : 'Send OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Admin Test Helper */}
              <div className="pt-2 border-t border-[#D0EEF9] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput('8289968045');
                    setAuthError('');
                  }}
                  className="text-[11px] text-amber-600 hover:text-amber-700 font-bold cursor-pointer"
                >
                  ⚡ Use Admin Phone (8289968045)
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* INLINE OTP AUTH STEP 2: VERIFY OTP                       */}
          {/* ======================================================== */}
          {activeSubView === 'login_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
              <div>
                <h4 className="text-sm font-black text-slate-900">Enter OTP Code</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Code sent to +91 {phoneInput}
                </p>
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[8px] py-2.5 bg-white border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:border-[#0EA5E0] shadow-xs"
                />
                <div className="p-2 rounded-xl bg-[#E0F7FA] text-[11px] text-[#00A3E0] text-center font-bold">
                  🔑 Mock OTP: Enter 123456 (or any code)
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs transition cursor-pointer active:scale-98 shadow-md"
              >
                {authLoading ? 'Verifying...' : 'Verify OTP & Enter'}
              </button>

              <button
                type="button"
                onClick={() => setActiveSubView('login_phone')}
                className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold transition cursor-pointer"
              >
                ← Change Phone Number
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* INLINE OTP AUTH STEP 3: NEW USER NAME                    */}
          {/* ======================================================== */}
          {activeSubView === 'login_name' && (
            <form onSubmit={handleFinishNewUser} className="space-y-4 pt-1">
              <div>
                <h4 className="text-sm font-black text-slate-900">What is your name?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Set up your profile for service bookings
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Aman Gupta / Ferdin"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0] shadow-xs"
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs transition cursor-pointer active:scale-98 shadow-md"
              >
                {authLoading ? 'Creating Profile...' : 'Complete & Start Booking'}
              </button>
            </form>
          )}

        </div>

        {/* ======================================================== */}
        {/* BOTTOM LOGOUT ACTION (PURE LOGOUT SYSTEM)                */}
        {/* ======================================================== */}
        {isLoggedIn && activeSubView === 'main' && (
          <div className="p-4 bg-[#E9F8FD] border-t border-[#D0EEF9] shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}

      </div>

      {/* Click outside to close backdrop (on the right) */}
      <div className="flex-1 cursor-pointer" onClick={onClose} />
    </div>
  );
}
