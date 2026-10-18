import React, { useState, useRef, useEffect } from 'react';
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
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { JobitLogo } from '../components/brand/JobitLogo';

export function AuthModal({ isOpen, onClose, onSuccess, onOpenWorkerOnboarding }) {
  const { 
    loginWithPhone, 
    loginWithPassword, 
    registerWithPhoneAndPassword, 
    checkPhoneRegistered, 
    loginAsWorker 
  } = useAuth();

  // Primary mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login');

  // Sub-step tracking
  // For login: 'password' | 'otp_phone' | 'otp_verify'
  // For signup: 'phone' | 'otp' | 'setup'
  const [loginStep, setLoginStep] = useState('password');
  const [signupStep, setSignupStep] = useState('phone');

  // Form states
  const [selectedRole, setSelectedRole] = useState('customer'); // 'customer' | 'worker'
  const [phone, setPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up setup states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Fast 6-Digit OTP State & Refs for smooth auto-focusing
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUserFound, setExistingUserFound] = useState(null);

  // Reset or focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  // Smooth UX: Auto-focus first digit input whenever entering an OTP step
  useEffect(() => {
    if (loginStep === 'otp_verify' || signupStep === 'otp') {
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus?.();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [loginStep, signupStep]);

  if (!isOpen) return null;

  // Direct Admin Login Helper with specific admin phone 8289968045
  const triggerAdminLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithPhone('8289968045', '123456', 'Master Admin', 'admin');
      onSuccess?.('admin');
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (val) => {
    const raw = val.replace(/\D/g, '');
    const cleanTen = raw.slice(-10);
    setPhone(cleanTen);
    setError('');
    setExistingUserFound(null);
  };

  // Helper for 6-digit OTP input handling
  const handleOtpDigitChange = (index, val) => {
    setError('');
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    // Auto-advance to next box if a digit was entered
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus?.();
    }

    // Auto-verify as soon as the 6th digit is typed!
    const fullCode = updated.join('');
    if (fullCode.length === 6) {
      if (authMode === 'login' && loginStep === 'otp_verify') {
        verifyLoginOtp(fullCode);
      } else if (authMode === 'signup' && signupStep === 'otp') {
        verifySignupOtp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus?.();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus?.();

    if (pasted.length === 6) {
      if (authMode === 'login' && loginStep === 'otp_verify') {
        verifyLoginOtp(pasted);
      } else if (authMode === 'signup' && signupStep === 'otp') {
        verifySignupOtp(pasted);
      }
    }
  };

  const quickFillMockOtp = (mode) => {
    const mock = ['1', '2', '3', '4', '5', '6'];
    setOtpDigits(mock);
    setError('');
    if (mode === 'login') {
      verifyLoginOtp('123456');
    } else {
      verifySignupOtp('123456');
    }
  };

  // ========================================================
  // LOGIN FLOW HANDLERS
  // ========================================================

  // 1. Password Login
  const handlePasswordLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    if (!cleanTen || cleanTen.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (cleanTen === '8289968045') {
      await triggerAdminLogin();
      return;
    }

    if (!loginPassword) {
      setError('Please enter your account password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await loginWithPassword(cleanTen, loginPassword);
      onSuccess?.(user.role || 'customer');
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials or use Login via OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Start Login via OTP
  const handleStartLoginOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    if (!cleanTen || cleanTen.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (cleanTen === '8289968045') {
      await triggerAdminLogin();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const regStatus = await checkPhoneRegistered(cleanTen);
      if (!regStatus.isRegistered) {
        setError(`No account found for +91 ${cleanTen}. Please sign up first.`);
        setLoading(false);
        return;
      }
      setExistingUserFound(regStatus.user);
      setOtpDigits(['', '', '', '', '', '']);
      setLoginStep('otp_verify');
    } catch (err) {
      setError(err.message || 'Error checking account');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Login OTP
  const verifyLoginOtp = async (otpCode) => {
    const code = otpCode || otpDigits.join('');
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    if (!code || code.length < 4) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await loginWithPhone(
        cleanTen, 
        code, 
        existingUserFound?.name || 'Customer', 
        existingUserFound?.role || selectedRole
      );
      onSuccess?.(user.role || 'customer');
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // SIGN-UP FLOW HANDLERS
  // ========================================================

  // Step 1: Send OTP for Sign-Up with STRICT ONE ACCOUNT PER MOBILE NUMBER CONSTRAINT
  const handleSignupPhoneSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    if (!cleanTen || cleanTen.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (cleanTen === '8289968045') {
      await triggerAdminLogin();
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Enforce database constraint: Strictly ONE account per mobile number!
      const regStatus = await checkPhoneRegistered(cleanTen);
      if (regStatus.isRegistered) {
        setError(`An account already exists for +91 ${cleanTen}. Strictly ONE account per mobile number. Please sign in instead.`);
        setExistingUserFound(regStatus.user);
        setLoading(false);
        return;
      }

      setOtpDigits(['', '', '', '', '', '']);
      setSignupStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to verify mobile number');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Sign-Up OTP -> Navigate directly to Username & Password Setup Screen
  const verifySignupOtp = async (otpCode) => {
    const code = otpCode || otpDigits.join('');
    if (!code || code.length < 4) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    // Fast simulation / Firebase OTP verification
    setTimeout(() => {
      setLoading(false);
      // Navigate directly to screen to set Username and Password
      setSignupStep('setup');
    }, 250);
  };

  // Step 3: Complete Sign-Up with Username and Password
  const handleSignupSetupSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    const username = signupUsername.trim();
    if (!username || username.length < 2) {
      setError('Please enter your full name or username (min 2 characters)');
      return;
    }

    if (!signupPassword || signupPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match! Please verify your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Enforce database constraint: Strictly ONE account per mobile number
      const newProfile = await registerWithPhoneAndPassword(
        cleanTen,
        username,
        signupPassword,
        selectedRole
      );

      onSuccess?.(newProfile.role || selectedRole);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create account');
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
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1-Tap Quick Demo Logins Header */}
        <div className="mb-4 pb-3 border-b border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            ⚡ Quick Demo Access
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                await loginWithPhone('9876500001', '123456', 'Aman Gupta', 'customer');
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

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center pb-2">
          <JobitLogo variant="horizontal" showTagline={false} className="mb-1" />
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Hyperlocal home services marketplace
          </p>
        </div>

        {/* Top Tab Switcher: Sign In vs Sign Up */}
        {(signupStep === 'phone' || loginStep === 'password' || loginStep === 'otp_phone') && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl mb-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginStep('password');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setSignupStep('phone');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-[#0EA5E0] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-3 text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 leading-snug">
              <span>{error}</span>
              {existingUserFound && authMode === 'signup' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginStep('password');
                    setError('');
                  }}
                  className="block mt-1 font-black text-[#0EA5E0] underline cursor-pointer"
                >
                  Click here to Sign In with Password or OTP →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* LOGIN FLOW VIEWS                                         */}
        {/* ======================================================== */}
        {authMode === 'login' && (
          <>
            {/* 1. Direct Mobile Number + Password Login */}
            {loginStep === 'password' && (
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-3.5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Sign in to your account</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Enter your mobile number and password</p>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="10-digit mobile number"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('otp_phone');
                        setError('');
                      }}
                      className="text-[11px] font-extrabold text-[#0EA5E0] hover:underline cursor-pointer"
                    >
                      Login via OTP?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="Enter account password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="w-6 h-6 absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In Fast</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to OTP Login Option */}
                <div className="pt-2 text-center border-t border-slate-100 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('otp_phone');
                      setError('');
                    }}
                    className="text-xs font-extrabold text-slate-600 hover:text-[#0EA5E0] transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#0EA5E0]" />
                    <span>Forgot password? <strong>Login via fast OTP</strong></span>
                  </button>

                  <p className="text-xs text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setSignupStep('phone');
                        setError('');
                      }}
                      className="font-black text-[#0EA5E0] hover:underline cursor-pointer"
                    >
                      Sign Up Here
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 2. Login via OTP - Phone step */}
            {loginStep === 'otp_phone' && (
              <form onSubmit={handleStartLoginOtp} className="space-y-3.5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Login with Fast OTP</h3>
                  <p className="text-[11px] text-slate-500 font-medium">We'll send a fast 6-digit code to verify your phone</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="10-digit mobile number"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Sending Code...</span>
                  ) : (
                    <>
                      <span>Send 6-Digit OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('password');
                    setError('');
                  }}
                  className="w-full text-xs text-slate-500 hover:text-slate-800 font-bold transition text-center"
                >
                  ← Sign In with Password instead
                </button>
              </form>
            )}

            {/* 3. Login via OTP - 6-Digit Code Verification */}
            {loginStep === 'otp_verify' && (
              <div className="space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mb-2">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Enter Verification Code</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Fast 6-digit code sent to <strong className="text-slate-800">+91 {phone}</strong>
                  </p>
                </div>

                {/* Fast Mock Code helper box */}
                <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs text-sky-900">
                  <span className="font-bold">🔑 Fast OTP: <strong>123456</strong></span>
                  <button
                    type="button"
                    onClick={() => quickFillMockOtp('login')}
                    className="px-2.5 py-1 rounded-xl bg-[#0EA5E0] text-white text-[10px] font-black hover:bg-[#0284C7] transition cursor-pointer active:scale-95"
                  >
                    Auto-fill
                  </button>
                </div>

                {/* 6 Individual Auto-Focusing Digit Cells */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={`w-11 h-12 text-center text-lg font-black rounded-xl border bg-slate-50 text-slate-900 outline-none transition ${
                        digit 
                          ? 'border-[#0EA5E0] bg-white ring-2 ring-[#0EA5E0]/20' 
                          : 'border-slate-200 focus:border-[#0EA5E0] focus:bg-white focus:ring-2 focus:ring-[#0EA5E0]/20'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => verifyLoginOtp()}
                  disabled={loading || otpDigits.join('').length < 4}
                  className="w-full py-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <button
                    type="button"
                    onClick={() => setLoginStep('otp_phone')}
                    className="hover:text-slate-800 font-bold"
                  >
                    ← Change Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('password');
                      setError('');
                    }}
                    className="font-bold text-[#0EA5E0] hover:underline"
                  >
                    Use Password instead
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* SIGN-UP FLOW VIEWS                                       */}
        {/* ======================================================== */}
        {authMode === 'signup' && (
          <>
            {/* STEP 1: Phone input & role selection */}
            {signupStep === 'phone' && (
              <form onSubmit={handleSignupPhoneSubmit} className="space-y-3.5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Create a New Account</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Strictly one account per mobile number</p>
                </div>

                {/* Role Selection Toggle */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">I am joining as</label>
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

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="10-digit mobile number"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Checking Database...</span>
                  ) : (
                    <>
                      <span>Get 6-Digit Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Direct link to worker onboarding */}
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
                      <span>Or complete full 4-Step Worker Onboarding</span>
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* STEP 2: Fast 6-Digit OTP Verification Screen */}
            {signupStep === 'otp' && (
              <div className="space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mb-2">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Verify Phone Number</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Fast 6-digit code sent to <strong className="text-slate-800">+91 {phone}</strong>
                  </p>
                </div>

                {/* 1-Tap Auto-fill Demo Box */}
                <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs text-sky-900">
                  <span className="font-bold">🔑 Fast OTP: <strong>123456</strong></span>
                  <button
                    type="button"
                    onClick={() => quickFillMockOtp('signup')}
                    className="px-2.5 py-1 rounded-xl bg-[#0EA5E0] text-white text-[10px] font-black hover:bg-[#0284C7] transition cursor-pointer active:scale-95"
                  >
                    Auto-fill
                  </button>
                </div>

                {/* 6 Individual Auto-Focusing Digit Cells */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={`w-11 h-12 text-center text-lg font-black rounded-xl border bg-slate-50 text-slate-900 outline-none transition ${
                        digit 
                          ? 'border-[#0EA5E0] bg-white ring-2 ring-[#0EA5E0]/20' 
                          : 'border-slate-200 focus:border-[#0EA5E0] focus:bg-white focus:ring-2 focus:ring-[#0EA5E0]/20'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => verifySignupOtp()}
                  disabled={loading || otpDigits.join('').length < 4}
                  className="w-full py-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Code & Set Password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSignupStep('phone');
                    setError('');
                  }}
                  className="w-full text-xs text-slate-500 hover:text-slate-800 font-bold transition text-center"
                >
                  ← Change Mobile Number
                </button>
              </div>
            )}

            {/* STEP 3: Navigate directly to screen to set Username and Password */}
            {signupStep === 'setup' && (
              <form onSubmit={handleSignupSetupSubmit} className="space-y-3.5 animate-scale-up">
                <div className="text-center pb-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 ring-4 ring-emerald-50/50">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Set Username & Password</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Phone +91 {phone} verified! Complete your security setup.
                  </p>
                </div>

                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Username / Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={signupUsername}
                      onChange={(e) => {
                        setSignupUsername(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="e.g. Rahul Sharma"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Create Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="At least 4 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="w-6 h-6 absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => {
                        setSignupConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                      placeholder="Re-type password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      className="w-6 h-6 absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Database Constraint Badge */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Enforcing constraint: Strictly 1 account per mobile number.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Setting up Profile...</span>
                  ) : (
                    <>
                      <span>Complete Account Creation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default AuthModal;
