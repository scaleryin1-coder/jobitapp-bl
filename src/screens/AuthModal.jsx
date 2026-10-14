import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  Sparkles, 
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase';
import { JobitLogo } from '../components/brand/JobitLogo';

export function AuthModal({ isOpen, onClose, onSuccess, onOpenWorkerOnboarding }) {
  const { loginWithPhone, checkPhoneRegistered, loginAsWorker } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'name'
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'worker'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUserFound, setExistingUserFound] = useState(null);

  if (!isOpen) return null;

  // Direct Admin Login Helper with specific admin phone 8289968045
  const triggerAdminLogin = async (customOtp = '123456') => {
    setLoading(true);
    setError('');
    try {
      await loginWithPhone('8289968045', customOtp, 'Master Admin', 'admin');
      onSuccess?.('admin');
      onClose();
    } catch (err) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (val) => {
    const raw = val.replace(/\D/g, '');
    const cleanTen = raw.slice(-10);
    setPhone(cleanTen);
    setError('');
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    if (!cleanTen || cleanTen.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');

    // Pre-check if account already exists for this phone
    try {
      if (cleanTen === '8289968045') {
        setSelectedRole('admin');
        setExistingUserFound({ name: 'Master Admin', role: 'admin' });
      } else {
        const regStatus = await checkPhoneRegistered?.(cleanTen);
        if (regStatus?.isRegistered && regStatus?.user) {
          setExistingUserFound(regStatus.user);
          if (regStatus.user?.role) {
            setSelectedRole(regStatus.user.role);
          }
        } else {
          setExistingUserFound(null);
        }
      }
    } catch {
      setExistingUserFound(null);
    }

    setStep('otp');
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    if (!otp || otp.length < 4) {
      setError('Please enter verification code (Mock OTP: 123456)');
      return;
    }
    setError('');

    // Specific Admin Phone Check: 8289968045 grants Admin Access
    if (cleanTen === '8289968045') {
      await triggerAdminLogin(otp);
      return;
    }

    // If existing account found -> log in directly
    if (existingUserFound) {
      setLoading(true);
      try {
        await loginWithPhone(cleanTen, otp, existingUserFound.name, existingUserFound.role || selectedRole);
        onSuccess?.(existingUserFound.role || selectedRole);
        onClose();
      } catch (err) {
        setError(err.message || 'Login failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // New user -> prompt for profile details or start worker onboarding
    if (selectedRole === 'worker') {
      // Direct option to open full multi-step onboarding
      onClose();
      onOpenWorkerOnboarding?.();
      return;
    }

    setStep('name');
  };

  const handleFinishCustomer = async (e) => {
    if (e) e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const finalName = name.trim() || 'Valued Customer';
      await loginWithPhone(cleanTen, otp, finalName, 'customer');
      onSuccess?.('customer');
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1-Tap Quick Dev Logins Header */}
        <div className="mb-4 pb-3 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            ⚡ Quick 1-Tap Fast Testing Access
          </p>
          <div className="flex flex-col gap-1.5">
            {/* ADMIN BUTTON (Critical Requirement) */}
            <button
              type="button"
              onClick={triggerAdminLogin}
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-100" />
                <span>👑 Admin Login (8289968045)</span>
              </div>
              <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold">Direct Admin</span>
            </button>

            {/* CUSTOMER & WORKER SHORTCUTS */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await loginWithPhone('9876500001', '1234', 'Aman Gupta', 'customer');
                  setLoading(false);
                  onSuccess?.('customer');
                  onClose();
                }}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer Demo</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await loginAsWorker({
                    id: 'worker_rajesh',
                    name: 'Rajesh Sharma',
                    skill: 'Plumbing Specialist',
                    phone: '98765 43210'
                  });
                  setLoading(false);
                  onSuccess?.('worker');
                  onClose();
                }}
                className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-[#0EA5E0] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#0EA5E0]" />
                <span>Verified Pro</span>
              </button>
            </div>
          </div>
        </div>

        {/* STEP 1: PHONE INPUT */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <div className="flex flex-col items-center text-center pb-1">
              <JobitLogo variant="horizontal" showTagline={false} className="mb-1" />
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Hyperlocal home services marketplace • Melattur
              </p>
            </div>

            {/* Role Selection Toggle */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Select Role</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedRole === 'customer' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('worker')}
                  className={`py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedRole === 'worker' 
                      ? 'bg-[#0EA5E0] text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Worker / Pro</span>
                </button>
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                <span className="text-[10px] text-amber-600 font-bold">Admin: 8289968045</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-black text-slate-400">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                  placeholder="8289968045 or your phone"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-semibold bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue with Phone</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Direct Multi-Step Worker Onboarding Link */}
            {selectedRole === 'worker' && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWorkerOnboarding?.();
                  }}
                  className="text-xs font-extrabold text-[#0EA5E0] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>New Pro? Complete 4-Step Worker Registration</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Enter Verification Code</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Code sent to +91 {phone}
              </p>
            </div>

            {existingUserFound && (
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-2.5 text-xs text-sky-900 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0EA5E0] shrink-0" />
                <span>Welcome back, <strong>{existingUserFound.name}</strong> ({existingUserFound.role})!</span>
              </div>
            )}

            <div className="space-y-1">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-[10px] py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                placeholder="123456"
                autoFocus
              />
              <p className="text-[11px] text-sky-600 bg-sky-50 py-1.5 px-2 rounded-xl text-center font-bold">
                🔑 Mock OTP: Enter 123456 (or any 6-digit code)
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-semibold bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-xs text-slate-400 hover:text-slate-700 font-bold transition"
            >
              ← Change Phone Number
            </button>
          </form>
        )}

        {/* STEP 3: CUSTOMER NAME (FOR NEW CUSTOMERS) */}
        {step === 'name' && (
          <form onSubmit={handleFinishCustomer} className="space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mb-2">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">What is your name?</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                This will appear on your service bookings and invoices
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aman Gupta / Priya Nair"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-semibold bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer"
            >
              {loading ? 'Creating Profile...' : 'Complete & Start Booking'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
