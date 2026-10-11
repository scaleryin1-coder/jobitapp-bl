import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Briefcase, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalWorkers } from '../data/bookingService';

export function PartnerLoginModal({ isOpen, onClose, onSuccess }) {
  const { loginAsWorker, loginAsAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('worker'); // 'worker' | 'admin'
  
  // Worker state
  const [workers, setWorkers] = useState([]);
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

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
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
      setError('Failed to log in as worker');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (adminEmail !== 'admin@jobit.com' || (adminPassword !== 'admin123' && adminPassword !== '1234')) {
      setError('Invalid admin credentials. Use demo: admin@jobit.com / admin123');
      setLoading(false);
      return;
    }

    try {
      await loginAsAdmin({ email: adminEmail, name: 'System Administrator' });
      onSuccess?.('admin');
      onClose();
    } catch (err) {
      setError('Failed to log in as admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Lock className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Partner & Staff Portal</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Authorized Personnel Access</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F1F3F5] rounded-full p-1 my-4 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('worker');
              setError('');
            }}
            className={`flex-1 py-2 rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'worker' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
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

        {/* Worker Login Form */}
        {activeTab === 'worker' && (
          <form onSubmit={handleWorkerSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Select Technician Identity
              </label>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#0EA5E0]"
              >
                {workers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.skill}) • +91 {w.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Technician Security PIN
              </label>
              <input
                type="password"
                maxLength="4"
                value={workerPin}
                onChange={(e) => setWorkerPin(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 tracking-widest text-center focus:border-[#0EA5E0] outline-none"
                placeholder="1234"
              />
              <p className="text-[10px] text-slate-400 text-center mt-1">Default Demo PIN: 1234</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-black text-xs shadow-glow hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Worker Pro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Admin Login Form */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-purple-600 outline-none"
                placeholder="admin@jobit.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-purple-600 outline-none"
                placeholder="••••••••"
              />
              <p className="text-[10px] text-slate-400 text-center mt-1">Default Demo Credentials pre-filled</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-md hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Verifying...' : 'Access Admin Control Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
