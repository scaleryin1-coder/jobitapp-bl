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
import { getLocalWorkers } from '../data/bookingService';

export function PartnerLoginModal({ isOpen, onClose, onSuccess }) {
  const { loginAsWorker, loginAsAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('worker'); // 'worker' | 'admin'
  
  // Worker state
  const [workers, setWorkers] = useState([]);
  const [workerLoginMethod, setWorkerLoginMethod] = useState('credentials'); // 'credentials' | 'profile'
  const [workerEmail, setWorkerEmail] = useState('worker@jobit.com');
  const [workerPassword, setWorkerPassword] = useState('worker123');
  const [selectedWorkerId, setSelectedWorkerId] = useState('worker_rajesh');
  const [workerPin, setWorkerPin] = useState('1234');
  
  // Admin state
  const [adminEmail, setAdminEmail] = useState('admin@jobit.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWorkers(getLocalWorkers());
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWorkerCredentialsSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    if (workerEmail.trim().toLowerCase() !== 'worker@jobit.com' || (workerPassword !== 'worker123' && workerPassword !== '1234')) {
      setError('Invalid worker credentials. Demo email: worker@jobit.com / worker123');
      setLoading(false);
      return;
    }

    try {
      const defaultWorker = workers.find(w => w.id === 'worker_rajesh') || workers[0] || {
        id: 'worker_rajesh',
        name: 'Rajesh Sharma',
        skill: 'Plumbing Specialist',
        phone: '98765 43210',
        email: 'worker@jobit.com'
      };
      await loginAsWorker(defaultWorker);
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
      setError('Please select a valid technician profile');
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
    setWorkerEmail('worker@jobit.com');
    setWorkerPassword('worker123');
    const defaultWorker = workers.find(w => w.id === 'worker_rajesh') || workers[0] || {
      id: 'worker_rajesh',
      name: 'Rajesh Sharma',
      skill: 'Plumbing Specialist',
      phone: '98765 43210'
    };
    loginAsWorker(defaultWorker).then(() => {
      onSuccess?.('worker');
      onClose();
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
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black text-sky-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0EA5E0]" />
                  <span>Demo Worker Pro</span>
                </span>
                <span className="text-[10px] bg-sky-200/60 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                  worker@jobit.com
                </span>
              </div>
              <button
                type="button"
                onClick={handleQuickWorkerLogin}
                className="w-full py-2.5 rounded-xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>⚡ Instant Worker Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black text-purple-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Demo Admin Access</span>
                </span>
                <span className="text-[10px] bg-purple-200/60 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  admin@jobit.com
                </span>
              </div>
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>⚡ Instant Admin Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

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
          </div>
        )}

      </div>
    </div>
  );
}
