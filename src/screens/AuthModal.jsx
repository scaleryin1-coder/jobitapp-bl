import React, { useState } from 'react';
import { X, Phone, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase';

export function AuthModal({ isOpen, onClose, onSuccess }) {
  const { loginWithPhone } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'name'
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('1234');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const triggerAdminBypass = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithPhone('+918289968045', '1234', 'Master Admin');
      onSuccess?.();
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

    // If exact admin phone number is typed/pasted, auto-trigger instant admin login
    if (cleanTen === '8289968045') {
      setTimeout(() => {
        triggerAdminBypass();
      }, 350);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    // If submitted with admin number, immediately bypass
    if (cleanTen === '8289968045') {
      await triggerAdminBypass();
      return;
    }

    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanTen = phone.replace(/\D/g, '').slice(-10);

    // If admin number reached OTP stage
    if (cleanTen === '8289968045') {
      await triggerAdminBypass();
      return;
    }

    if (!otp || otp.length < 4) {
      setError('Please enter 4-digit verification code');
      return;
    }
    setError('');
    setStep('name');
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithPhone(phone, otp, name.trim() || 'Valued Customer');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {!isFirebaseConfigured && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Firebase not configured (running in local offline session mode)</span>
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp}>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mb-3">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Welcome to JOBit</h3>
            <p className="text-xs text-slate-500 mb-5">Enter your phone number to continue</p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-sm font-bold text-slate-500">+91</span>
                <input
                  type="tel"
                  maxLength="10"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                  placeholder="9876543210"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-bold text-sm shadow-glow hover:opacity-95 transition"
            >
              Get OTP
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Verify Code</h3>
            <p className="text-xs text-slate-500 mb-5">Sent 4-digit code to +91 {phone}</p>

            <div className="mb-4">
              <input
                type="text"
                maxLength="4"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-[12px] py-3.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 focus:outline-none focus:border-[#0EA5E0]"
                placeholder="1234"
              />
              <p className="text-[11px] text-slate-400 text-center mt-2">Demo code: 1234</p>
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-bold text-sm shadow-glow hover:opacity-95 transition"
            >
              Verify & Proceed
            </button>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={handleFinish}>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center mb-3">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">What's your name?</h3>
            <p className="text-xs text-slate-500 mb-5">We'll use this for your service bookings</p>

            <div className="mb-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                placeholder="e.g. John Doe"
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-bold text-sm shadow-glow hover:opacity-95 transition"
            >
              {loading ? 'Creating Account...' : 'Complete & Start'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
