import React, { useState, useEffect } from 'react';
import { 
  X, 
  Briefcase, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  KeyRound,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalWorkers, getPendingWorkers, DUMMY_WORKER_IDS } from '../data/bookingService';

export function PartnerLoginModal({ isOpen, onClose, onSuccess, onOpenWorkerOnboarding }) {
  const { loginAsWorker } = useAuth();
  
  // Worker state
  const [workers, setWorkers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [workerLoginMethod, setWorkerLoginMethod] = useState('credentials'); // 'credentials' | 'profile'
  const [workerEmail, setWorkerEmail] = useState('worker@jobit.com');
  const [workerPassword, setWorkerPassword] = useState('worker123');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerPin, setWorkerPin] = useState('1234');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allWorkers = getLocalWorkers();
      const approvedOnly = allWorkers.filter(w => (w.status === 'approved' || w.workerStatus === 'approved') && !DUMMY_WORKER_IDS?.has(w.id));
      const pendingList = getPendingWorkers();
      setWorkers(approvedOnly);
      setPendingWorkers(pendingList);
      if (approvedOnly.length > 0) {
        setSelectedWorkerId(approvedOnly[0].id);
      } else if (pendingList.length > 0) {
        setSelectedWorkerId(pendingList[0].id);
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

    try {
      const cleanInput = workerEmail.trim().toLowerCase();
      const cleanPhone = cleanInput.replace(/\D/g, '').slice(-10);

      // Check in approved workers
      let targetWorker = workers.find(w => 
        (w.email && w.email.toLowerCase() === cleanInput) ||
        (w.phone && cleanPhone && w.phone.replace(/\D/g, '').slice(-10) === cleanPhone)
      );

      // If not in approved, check in pending applicants
      let isPending = false;
      if (!targetWorker) {
        targetWorker = pendingWorkers.find(p => 
          (p.email && p.email.toLowerCase() === cleanInput) ||
          (p.phone && cleanPhone && p.phone.replace(/\D/g, '').slice(-10) === cleanPhone)
        );
        if (targetWorker) isPending = true;
      }

      // If still not found and no registered workers exist
      if (!targetWorker) {
        if (workers.length === 0 && pendingWorkers.length === 0) {
          setError('No registered technicians found in database. Please click "Register as New Pro" to submit your application.');
          setLoading(false);
          return;
        }
        targetWorker = workers[0] || pendingWorkers[0];
        if (!targetWorker) {
          setError(`No technician record found for "${workerEmail}". Please check credentials or register.`);
          setLoading(false);
          return;
        }
      }

      await loginAsWorker(targetWorker);
      onSuccess?.('worker');
      onClose();
    } catch (err) {
      console.error('Worker login failed:', err);
      const errMsg = err?.message || 'Database error occurred during login.';
      setError('Technician Login Failed: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerProfileSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const targetWorker = workers.find(w => w.id === selectedWorkerId) || pendingWorkers.find(p => p.id === selectedWorkerId);
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
      console.error('Worker profile login error:', err);
      const errMsg = err?.message || 'Failed to authenticate technician profile.';
      setError('Login Error: ' + errMsg);
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

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#0B1528] text-white flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Technician & Partner Portal</h3>
            <p className="text-[11px] text-slate-400 font-semibold">Access verified professional dashboard</p>
          </div>
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
                className="w-full py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#12233f] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
              className="w-full py-2 rounded-xl bg-white border border-[#0A192F] text-[#0A192F] hover:bg-slate-50 text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
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
                className={`cursor-pointer ${workerLoginMethod === 'credentials' ? 'text-[#0A192F] font-black underline' : 'hover:text-slate-800'}`}
              >
                Email & Pass
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setWorkerLoginMethod('profile')}
                className={`cursor-pointer ${workerLoginMethod === 'profile' ? 'text-[#0A192F] font-black underline' : 'hover:text-slate-800'}`}
              >
                PIN / Profile
              </button>
            </div>
          </div>

          {workerLoginMethod === 'credentials' ? (
            <form onSubmit={handleWorkerCredentialsSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Worker Email or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={workerEmail}
                    onChange={(e) => setWorkerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#0A192F] outline-none"
                    placeholder="worker@jobit.com or phone"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={workerPassword}
                    onChange={(e) => setWorkerPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#0A192F] outline-none"
                    placeholder="worker123"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#0A192F] hover:bg-[#12233f] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Pro Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleWorkerProfileSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Select Registered Worker Profile
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-[#0A192F] outline-none"
                >
                  {workers.length === 0 && pendingWorkers.length === 0 && (
                    <option value="">No technicians found - Register Below</option>
                  )}
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.skill || w.trade || 'Technician'}) - Approved
                    </option>
                  ))}
                  {pendingWorkers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.skill || p.trade || 'Technician'}) - Awaiting Approval
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Worker Security PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    maxLength={4}
                    value={workerPin}
                    onChange={(e) => setWorkerPin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tracking-widest text-slate-800 focus:border-[#0A192F] outline-none"
                    placeholder="1234"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default Demo PIN: 1234</p>
              </div>

              <button
                type="submit"
                disabled={loading || (!selectedWorkerId && workers.length === 0 && pendingWorkers.length === 0)}
                className="w-full py-3 rounded-full bg-[#0A192F] hover:bg-[#12233f] text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{loading ? 'Accessing...' : 'Open Worker Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
