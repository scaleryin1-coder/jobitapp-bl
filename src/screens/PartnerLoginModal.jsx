import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Briefcase, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  KeyRound,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalWorkers, DUMMY_WORKER_IDS } from '../data/bookingService';

export function PartnerLoginModal({ isOpen, onClose, onSuccess, onOpenWorkerOnboarding }) {
  const { loginAsWorker, loginAsAdmin, loginWithPhone } = useAuth();
  const [activeTab, setActiveTab] = useState('worker'); // 'worker' | 'admin'
  
  // Worker state
  const [workers, setWorkers] = useState([]);
  const [workerLoginMethod, setWorkerLoginMethod] = useState('credentials'); // 'credentials' | 'profile'
  const [workerEmail, setWorkerEmail] = useState('worker@jobit.com');
  const [workerPassword, setWorkerPassword] = useState('worker123');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerPin, setWorkerPin] = useState('1234');
  
  // Admin state
  const [adminAuthType, setAdminAuthType] = useState('phone'); // 'phone' | 'email'
  const [adminPhone, setAdminPhone] = useState('8289968045');
  const [adminOtp, setAdminOtp] = useState('123456');
  const [adminEmail, setAdminEmail] = useState('admin@jobit.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allWorkers = getLocalWorkers();
      const approvedOnly = allWorkers.filter(w => (w.status === 'approved' || w.workerStatus === 'approved') && !DUMMY_WORKER_IDS?.has(w.id));
      setWorkers(approvedOnly);
      if (approvedOnly.length > 0) {
        setSelectedWorkerId(approvedOnly[0].id);
      } else {
        setSelectedWorkerId('');
      }
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWorkerCredentialsSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    if (workers.length === 0) {
      setError('No registered & approved technicians found in the database. Please register as a new partner first.');
      setLoading(false);
      return;
    }

    try {
      const targetWorker = workers.find(w => w.email && w.email.toLowerCase() === workerEmail.trim().toLowerCase()) || workers[0];
      if (!targetWorker) {
        setError('Technician record not found.');
        setLoading(false);
        return;
      }
      await loginAsWorker(targetWorker);
      onSuccess?.('worker');
      onClose();
    } catch (err) {
      setError('Failed to log in as worker: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerProfileSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const targetWorker = workers.find(w => w.id === selectedWorkerId);
    if (!targetWorker) {
      setError('Please select a valid registered technician profile');
      setLoading(false);
      return;
    }

    try {
      await loginAsWorker(targetWorker);
      onSuccess?.('worker');
      onClose();
    } catch (err) {
      setError('Failed to log in as technician');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminPhoneSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const cleanTen = adminPhone.replace(/\D/g, '').slice(-10);
    if (cleanTen !== '8289968045') {
      setError('Invalid admin phone number. Master Admin phone is 8289968045.');
      setLoading(false);
      return;
    }

    if (!adminOtp || adminOtp.length < 4) {
      setError('Please enter verification code (Mock OTP: 123456).');
      setLoading(false);
      return;
    }

    try {
      await loginWithPhone('8289968045', adminOtp, 'Master Admin', 'admin');
      onSuccess?.('admin');
      onClose();
    } catch (err) {
      setError('Admin verification failed: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const emailClean = adminEmail.trim().toLowerCase();
    if (emailClean !== 'admin@jobit.com' || (adminPassword !== 'admin123' && adminPassword !== '1234')) {
      setError('Invalid admin credentials. Use demo: admin@jobit.com / admin123');
      setLoading(false);
      return;
    }

    try {
      await loginAsAdmin({ email: adminEmail, name: 'System Administrator' });
      onSuccess?.('admin');
      onClose();
    } catch (err) {
      setError('Failed to log in as admin: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickWorkerLogin = () => {
    if (workers.length === 0) {
      setError('No registered & approved technicians in database. Please register as a new partner.');
      return;
    }
    const target = workers[0];
    loginAsWorker(target).then(() => {
      onSuccess?.('worker');
      onClose();
    }).catch(err => {
      setError('Failed to log in: ' + (err.message || 'Error'));
    });
  };

  const handleQuickAdminLogin = () => {
    setAdminEmail('admin@jobit.com');
    setAdminPassword('admin123');
    loginAsAdmin({ email: 'admin@jobit.com', name: 'System Administrator' }).then(() => {
      onSuccess?.('admin');
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Lock className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Partner & Staff Portal</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Authorized Worker Pro & Admin Logins</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F1F3F5] rounded-full p-1 my-3.5 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('worker');
              setError('');
            }}
            className={`flex-1 py-2 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'worker' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Worker Pro</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('admin');
              setError('');
            }}
            className={`flex-1 py-2 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'admin' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control</span>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-2xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================= */}
        {/* Worker Login Form                         */}
        {/* ========================================= */}
        {activeTab === 'worker' && (
          <div className="space-y-3.5">
            {/* Quick 1-Click Login Card */}
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-sky-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0EA5E0]" />
                  <span>Verified Pro Access</span>
                </span>
                {workers.length > 0 && (
                  <span className="text-[10px] bg-sky-200/60 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                    {workers[0].name}
                  </span>
                )}
              </div>
              {workers.length > 0 ? (
                <button
                  type="button"
                  onClick={handleQuickWorkerLogin}
                  className="w-full py-2.5 rounded-xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>⚡ Instant Verified Pro Login ({workers[0].name})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <p className="text-[11px] text-slate-500 font-medium">
                  No verified technicians registered yet. Complete onboarding below to register your account.
                </p>
              )}

              {/* Onboard New Worker Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkerOnboarding?.();
                }}
                className="w-full py-2 rounded-xl bg-white border border-[#0EA5E0] text-[#0EA5E0] hover:bg-sky-50 text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🚀 Register as New Pro (4-Step Form)</span>
              </button>
            </div>

            {/* Method Toggle: Email/Password vs Select Profile */}
            <div className="flex justify-between items-center text-[11px] px-1 font-semibold text-slate-500">
              <span>Or sign in with:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWorkerLoginMethod('credentials')}
                  className={`cursor-pointer ${workerLoginMethod === 'credentials' ? 'text-[#0EA5E0] font-black underline' : 'hover:text-slate-800'}`}
                >
                  Email & Pass
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setWorkerLoginMethod('profile')}
                  className={`cursor-pointer ${workerLoginMethod === 'profile' ? 'text-[#0EA5E0] font-black underline' : 'hover:text-slate-800'}`}
                >
                  PIN / Profile
                </button>
              </div>
            </div>

            {workerLoginMethod === 'credentials' ? (
              <form onSubmit={handleWorkerCredentialsSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Worker Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={workerEmail}
                      onChange={(e) => setWorkerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#0EA5E0] outline-none"
                      placeholder="worker@jobit.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Worker Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={workerPassword}
                      onChange={(e) => setWorkerPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#0EA5E0] outline-none"
                      placeholder="worker123"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In as Worker Pro'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleWorkerProfileSubmit} className="space-y-3">
                {workers.length > 0 ? (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Select Technician Identity
                      </label>
                      <select
                        value={selectedWorkerId}
                        onChange={(e) => setSelectedWorkerId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0EA5E0]"
                      >
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.skill}) • +91 {w.phone}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Technician Security PIN
                      </label>
                      <input
                        type="password"
                        maxLength="4"
                        value={workerPin}
                        onChange={(e) => setWorkerPin(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 tracking-widest text-center focus:border-[#0EA5E0] outline-none"
                        placeholder="1234"
                      />
                      <p className="text-[10px] text-slate-400 text-center mt-1">Default PIN: 1234</p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-full bg-slate-900 text-white font-black text-xs hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{loading ? 'Authenticating...' : 'Login with Selected Identity'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-2 border border-slate-200/60">
                    <p className="text-xs font-bold text-slate-700">No Approved Technicians Registered Yet</p>
                    <p className="text-[11px] text-slate-500">
                      Please submit a partner application using the registration form above to create your profile.
                    </p>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* Admin Login Form                          */}
        {/* ========================================= */}
        {activeTab === 'admin' && (
          <div className="space-y-3.5">
            {/* Quick 1-Click Admin Card */}
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-purple-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Master Admin Access</span>
                </span>
                <span className="text-[10px] bg-purple-200/60 text-purple-800 px-2 py-0.5 rounded-full font-black">
                  8289968045
                </span>
              </div>

              {/* 8289968045 Direct Admin Trigger */}
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await loginWithPhone('8289968045', '123456', 'Master Admin', 'admin');
                  setLoading(false);
                  onSuccess?.('admin');
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>👑 Quick 1-Tap Login (8289968045)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auth Sub-mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdminAuthType('phone')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  adminAuthType === 'phone' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Phone & Mock OTP
              </button>
              <button
                type="button"
                onClick={() => setAdminAuthType('email')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  adminAuthType === 'email' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Admin Credentials
              </button>
            </div>

            {adminAuthType === 'phone' ? (
              <form onSubmit={handleAdminPhoneSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Admin Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, '').slice(-10))}
                      className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-purple-600 outline-none"
                      placeholder="8289968045"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mock OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={adminOtp}
                    onChange={(e) => setAdminOtp(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center tracking-widest text-slate-900 focus:border-purple-600 outline-none"
                    placeholder="123456"
                  />
                  <p className="text-[10px] text-purple-600 font-bold text-center mt-1">
                    🔑 Mock OTP: 123456 (or any 6-digit code)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? 'Verifying Admin...' : 'Verify Phone & Access Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-purple-600 outline-none"
                      placeholder="admin@jobit.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Admin Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-purple-600 outline-none"
                      placeholder="admin123"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-1">Credentials pre-filled (admin@jobit.com / admin123)</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-md hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? 'Verifying...' : 'Access Admin Control Center'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
