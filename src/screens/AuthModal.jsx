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
  RotateCcw,
  Clock,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { JobitLogo } from '../components/brand/JobitLogo';
import { sendWhatsAppOtp, verifyWhatsAppOtp } from '../utils/whatsappOtpService';

export function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 3.67C16.57 3.67 20.28 7.37 20.28 11.9C20.28 16.42 16.57 20.12 12.05 20.12C10.53 20.12 9.09 19.7 7.85 18.96L7.55 18.78L4.43 19.6L5.26 16.55L5.06 16.23C4.24 14.93 3.8 13.43 3.8 11.9C3.8 7.37 7.51 3.67 12.05 3.67M9.27 7.5C9.09 7.5 8.79 7.56 8.54 7.84C8.28 8.11 7.56 8.78 7.56 10.15C7.56 11.52 8.56 12.84 8.7 13.02C8.84 13.21 10.66 16.02 13.45 17.22C14.11 17.51 14.63 17.68 15.03 17.81C15.7 18.02 16.31 17.99 16.79 17.92C17.33 17.84 18.45 17.24 18.68 16.58C18.92 15.92 18.92 15.36 18.84 15.24C18.77 15.13 18.59 15.06 18.32 14.93C18.05 14.8 16.75 14.16 16.51 14.07C16.27 13.98 16.1 13.93 15.92 14.21C15.75 14.48 15.25 15.06 15.1 15.24C14.95 15.42 14.8 15.44 14.53 15.31C14.26 15.18 13.39 14.89 12.35 13.97C11.55 13.25 11 12.37 10.85 12.11C10.7 11.84 10.83 11.7 10.97 11.57C11.1 11.44 11.25 11.23 11.39 11.07C11.53 10.91 11.57 10.79 11.66 10.61C11.75 10.43 11.71 10.27 11.64 10.14C11.57 10 11.03 8.68 10.8 8.14C10.58 7.61 10.36 7.68 10.19 7.68C10.03 7.67 9.85 7.67 9.67 7.67C9.49 7.67 9.27 7.5 9.27 7.5Z" />
    </svg>
  );
}

export function AuthModal({ isOpen, onClose, onSuccess, onOpenWorkerOnboarding, bookingPrompt = false }) {
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
  const [loginIdentifier, setLoginIdentifier] = useState('');
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

  // WhatsApp OTP timer and delivery states
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpSentNotification, setOtpSentNotification] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUserFound, setExistingUserFound] = useState(null);

  // Reset or focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpSentNotification('');
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

  // Countdown timer for Resend via WhatsApp
  useEffect(() => {
    let interval = null;
    if ((loginStep === 'otp_verify' || signupStep === 'otp') && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loginStep, signupStep, resendTimer]);

  if (!isOpen) return null;

  // Direct Admin Login Helper with specific admin phone 8289968045
  const triggerAdminLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithPhone('8289968045', 'admin_auth', 'Master Admin', 'admin');
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
    setLoginIdentifier(val);
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

  // Helper to resend WhatsApp OTP with 30s countdown reset
  const handleResendWhatsAppOtp = async (targetMode = authMode) => {
    const cleanTen = phone.replace(/\D/g, '').slice(-10);
    if (!cleanTen || cleanTen.length !== 10) return;

    setLoading(true);
    setError('');
    try {
      const res = await sendWhatsAppOtp(cleanTen, targetMode);
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpSentNotification(`New 6-digit WhatsApp OTP sent to +91 ${cleanTen}`);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus?.();
      }, 80);
    } catch (err) {
      setError(err.message || 'Failed to resend WhatsApp OTP');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // LOGIN FLOW HANDLERS
  // ========================================================

  // 1. Password Login
  const handlePasswordLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const identifier = (loginIdentifier || phone).trim();

    if (!identifier) {
      setError('Please enter your 10-digit mobile number or username');
      return;
    }

    const cleanTen = identifier.replace(/\D/g, '').slice(-10);

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
      const user = await loginWithPassword(identifier, loginPassword);
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
      if (regStatus.isRegistered && regStatus.user) {
        setExistingUserFound(regStatus.user);
      } else {
        // Dummy OTP testing fallback: allows logging in directly with any mobile number
        setExistingUserFound({
          uid: 'usr_' + cleanTen,
          phone: `+91 ${cleanTen}`,
          name: 'Valued Customer',
          role: selectedRole
        });
      }

      // Trigger OTP dispatch / Dummy OTP fallback
      await sendWhatsAppOtp(cleanTen, 'login');
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['1', '2', '3', '4', '5', '6']);
      setOtpSentNotification(`WhatsApp OTP sent to +91 ${cleanTen}`);
      setLoginStep('otp_verify');
    } catch (err) {
      setError(err.message || 'Error sending WhatsApp OTP');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Login OTP
  const verifyLoginOtp = async (otpCode) => {
    const code = otpCode || otpDigits.join('');
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    if (!code || code.length < 6) {
      setError('Please enter the 6-digit WhatsApp verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await verifyWhatsAppOtp(cleanTen, code);
      if (!isValid) {
        throw new Error('Invalid or expired WhatsApp OTP. Please check the code or tap "Resend via WhatsApp".');
      }

      // Query database directly using the authenticated phone number
      const regStatus = await checkPhoneRegistered(cleanTen);

      if (regStatus.isRegistered && regStatus.user) {
        // Matching profile exists:
        // Retrieve the user's role (Worker or Customer) and account status.
        // Redirect them directly to their respective Dashboard.
        // DO NOT route them to the onboarding/registration screen.
        const existingProfile = regStatus.user;
        const user = await loginWithPhone(
          cleanTen, 
          code, 
          existingProfile.name || 'Valued Customer', 
          existingProfile.role || 'customer',
          existingProfile
        );
        onSuccess?.(user.role || 'customer');
        onClose();
        return;
      }

      // If truly no matching profile exists in database, route to signup setup
      setSignupUsername('');
      setSignupStep('setup');
      setAuthMode('signup');
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
      // If an account already exists across devices, seamlessly switch to OTP login!
      const regStatus = await checkPhoneRegistered(cleanTen);
      if (regStatus.isRegistered && regStatus.user) {
        setExistingUserFound(regStatus.user);
        await sendWhatsAppOtp(cleanTen, 'login');
        setResendTimer(30);
        setCanResend(false);
        setOtpDigits(['1', '2', '3', '4', '5', '6']);
        setOtpSentNotification(`Existing account found! WhatsApp OTP sent to +91 ${cleanTen}`);
        setAuthMode('login');
        setLoginStep('otp_verify');
        setLoading(false);
        return;
      }

      // Truly new user: trigger WhatsApp OTP verification
      const res = await sendWhatsAppOtp(cleanTen, 'signup');
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['1', '2', '3', '4', '5', '6']);
      setOtpSentNotification(`6-digit OTP sent to your WhatsApp (+91 ${cleanTen})`);
      setSignupStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send WhatsApp verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Sign-Up OTP -> Check if account already exists before setup
  const verifySignupOtp = async (otpCode) => {
    const code = otpCode || otpDigits.join('');
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    if (!code || code.length < 6) {
      setError('Please enter the 6-digit WhatsApp verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await verifyWhatsAppOtp(cleanTen, code);
      if (!isValid) {
        throw new Error('Invalid or expired WhatsApp OTP. Please check the code or tap "Resend via WhatsApp".');
      }

      // Check if user already exists in database across devices
      const regStatus = await checkPhoneRegistered(cleanTen);
      if (regStatus.isRegistered && regStatus.user) {
        // Matching profile exists: redirect directly to Dashboard without onboarding
        const user = await loginWithPhone(
          cleanTen, 
          code, 
          regStatus.user.name || 'Valued Customer', 
          regStatus.user.role || selectedRole,
          regStatus.user
        );
        onSuccess?.(user.role || 'customer');
        onClose();
        return;
      }

      // Once OTP is verified for a truly new user, navigate immediately to set Username and Password
      setTimeout(() => {
        setLoading(false);
        setSignupStep('setup');
      }, 200);
    } catch (err) {
      setError(err.message || 'Invalid WhatsApp verification code');
      setLoading(false);
    }
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

        {/* Brand Header: Official JOBit logo/text neatly centered */}
        <div className="flex flex-col items-center justify-center text-center pt-1 pb-4">
          <div className="flex items-center justify-center font-sans tracking-tight text-3xl font-black select-none">
            <span className="text-[#0B172E]">JOB</span>
            <span className="text-[#D32F2F] ml-0.5">it</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-1">
            Reliable Local Services
          </p>
        </div>

        {/* Top Tab Switcher: Sign In vs Sign Up */}
        {(signupStep === 'phone' || loginStep === 'password' || loginStep === 'otp_phone') && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginStep('password');
                setError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
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
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-4 text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-xl border border-red-200 flex items-start gap-2 animate-fade-in">
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
                  className="block mt-1 font-bold text-[#0B172E] underline cursor-pointer"
                >
                  Click here to Sign In with Password or OTP →
                </button>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp OTP Sent Notification Banner */}
        {otpSentNotification && (loginStep === 'otp_verify' || signupStep === 'otp') && (
          <div className="mb-4 text-xs text-emerald-800 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80 flex items-center gap-2 animate-fade-in shadow-xs">
            <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1 text-[11px] font-bold">{otpSentNotification}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* LOGIN FLOW VIEWS                                         */}
        {/* ======================================================== */}
        {authMode === 'login' && (
          <>
            {/* 1. Direct Mobile Number + Password Login */}
            {loginStep === 'password' && (
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sign in to your account</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your mobile number and password</p>
                </div>

                {/* Mobile Number or Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mobile Number or Username</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400 flex items-center">
                      {/^\d+$/.test(loginIdentifier || phone) ? '+91' : <User className="w-4 h-4 text-slate-400" />}
                    </span>
                    <input
                      type="text"
                      required
                      value={loginIdentifier || phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLoginIdentifier(val);
                        const digits = val.replace(/\D/g, '');
                        if (digits) {
                          setPhone(digits.slice(-10));
                        }
                        setError('');
                      }}
                      className={`w-full ${/^\d+$/.test(loginIdentifier || phone) ? 'pl-12' : 'pl-10'} pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all`}
                      placeholder="10-digit mobile or username"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('otp_phone');
                        setError('');
                      }}
                      className="text-[11px] font-bold text-slate-700 hover:text-[#0B172E] hover:underline cursor-pointer"
                    >
                      Login via OTP?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="Enter account password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="w-7 h-7 absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#0B172E] hover:bg-[#182848] text-white font-bold text-xs shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
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
                    className="text-xs font-semibold text-slate-600 hover:text-[#0B172E] transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
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
                      className="font-bold text-[#0B172E] hover:underline cursor-pointer"
                    >
                      Sign Up Here
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 2. Login via OTP - Phone step */}
            {loginStep === 'otp_phone' && (
              <form onSubmit={handleStartLoginOtp} className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Login with Fast OTP</h3>
                  <p className="text-xs text-slate-500 mt-0.5">We'll send a 6-digit code to verify your phone</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="10-digit mobile number"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#0B172E] hover:bg-[#182848] text-white font-bold text-xs shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
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
                  className="w-full text-xs text-slate-500 hover:text-slate-800 font-bold transition text-center cursor-pointer"
                >
                  ← Sign In with Password instead
                </button>
              </form>
            )}

            {/* 3. Login via WhatsApp OTP - 6-Digit Code Verification */}
            {loginStep === 'otp_verify' && (
              <div className="space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 ring-4 ring-emerald-500/10">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">WhatsApp OTP Verification</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      WhatsApp
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    6-digit code sent via WhatsApp to <strong className="text-slate-800">+91 {phone}</strong>
                  </p>
                </div>

                {/* WhatsApp delivery & test OTP banner */}
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-600">
                      OTP: <strong className="font-bold text-slate-900 tracking-wider">123456</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpDigits(['1', '2', '3', '4', '5', '6']);
                      setError('');
                      verifyLoginOtp('123456');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 text-white text-[10px] font-bold hover:bg-slate-900 transition cursor-pointer active:scale-95 shadow-xs"
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
                          ? 'border-slate-800 bg-white ring-2 ring-slate-800/10' 
                          : 'border-slate-200 focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => verifyLoginOtp()}
                  disabled={loading || otpDigits.join('').length < 6}
                  className="w-full py-3.5 rounded-2xl bg-[#0B172E] hover:bg-[#182848] text-white font-bold text-xs shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying WhatsApp OTP...' : 'Verify WhatsApp OTP & Sign In'}
                </button>

                {/* Timer and Resend via WhatsApp Button */}
                <div className="pt-1 flex flex-col items-center gap-2">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={() => handleResendWhatsAppOtp('login')}
                      disabled={loading}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                      <span>Resend via WhatsApp</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 py-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend via WhatsApp in <strong className="text-slate-700 font-bold">0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</strong></span>
                    </div>
                  )}

                  <div className="flex items-center justify-between w-full text-xs text-slate-500 pt-1">
                    <button
                      type="button"
                      onClick={() => setLoginStep('otp_phone')}
                      className="hover:text-slate-800 font-bold cursor-pointer"
                    >
                      ← Change Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('password');
                        setError('');
                      }}
                      className="font-bold text-[#0B172E] hover:underline cursor-pointer"
                    >
                      Use Password instead
                    </button>
                  </div>
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
              <form onSubmit={handleSignupPhoneSubmit} className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create an Account</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Strictly one account per mobile number</p>
                </div>

                {/* Role Selection Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">I am joining as</label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('customer')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedRole === 'customer' 
                          ? 'bg-white text-slate-900 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Customer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('worker')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedRole === 'worker' 
                          ? 'bg-white text-slate-900 shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Worker / Pro</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="10-digit mobile number"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#0B172E] hover:bg-[#182848] text-white font-bold text-xs shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <span>Checking Database...</span>
                  ) : (
                    <>
                      <WhatsAppIcon className="w-4 h-4" />
                      <span>Get WhatsApp Verification Code</span>
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
                      className="text-xs font-bold text-slate-700 hover:text-[#0B172E] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Or complete full 4-Step Worker Onboarding</span>
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* STEP 2: Fast 6-Digit WhatsApp OTP Verification Screen */}
            {signupStep === 'otp' && (
              <div className="space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 ring-4 ring-emerald-500/10">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">WhatsApp OTP Verification</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      WhatsApp
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    6-digit code sent via WhatsApp to <strong className="text-slate-800">+91 {phone}</strong>
                  </p>
                </div>

                {/* WhatsApp delivery & test OTP banner */}
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-600">
                      OTP: <strong className="font-bold text-slate-900 tracking-wider">123456</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpDigits(['1', '2', '3', '4', '5', '6']);
                      setError('');
                      verifySignupOtp('123456');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 text-white text-[10px] font-bold hover:bg-slate-900 transition cursor-pointer active:scale-95 shadow-xs"
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
                          ? 'border-slate-800 bg-white ring-2 ring-slate-800/10' 
                          : 'border-slate-200 focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => verifySignupOtp()}
                  disabled={loading || otpDigits.join('').length < 6}
                  className="w-full py-3.5 rounded-2xl bg-[#0B172E] hover:bg-[#182848] text-white font-bold text-xs shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying WhatsApp OTP...' : 'Verify Code & Set Password'}
                </button>

                {/* Timer and Resend via WhatsApp Button */}
                <div className="pt-1 flex flex-col items-center gap-2">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={() => handleResendWhatsAppOtp('signup')}
                      disabled={loading}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                      <span>Resend via WhatsApp</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 py-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend via WhatsApp in <strong className="text-slate-700 font-bold">0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</strong></span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep('phone');
                      setError('');
                    }}
                    className="w-full text-xs text-slate-500 hover:text-slate-800 font-bold transition text-center cursor-pointer"
                  >
                    ← Change Mobile Number
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Navigate directly to screen to set Username and Password */}
            {signupStep === 'setup' && (
              <form onSubmit={handleSignupSetupSubmit} className="space-y-4 animate-scale-up">
                <div className="text-center pb-1">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 ring-4 ring-emerald-50/50">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Set Full Name & Password</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phone +91 {phone} verified! Complete your profile.
                  </p>
                </div>

                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={signupUsername}
                      onChange={(e) => {
                        setSignupUsername(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="e.g. Rahul Sharma"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Create Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="At least 4 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="w-7 h-7 absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => {
                        setSignupConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="Re-type password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      className="w-7 h-7 absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-[#0B172E] hover:bg-[#182848] text-white font-bold text-xs shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
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
