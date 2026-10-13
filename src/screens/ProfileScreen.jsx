import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  LogOut, 
  ShieldCheck, 
  Settings, 
  CheckCircle2, 
  ChevronRight,
  Camera,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase';

export function ProfileScreen({ 
  onOpenPartnerLogin,
  onOpenAuth, 
  onViewSplash,
  onOpenWorkerOnboarding
}) {
  const { currentUser, updateUserProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(() => currentUser?.name || 'Ferdin');
  const [city, setCity] = useState(() => currentUser?.city || currentUser?.address || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala');
  const [email, setEmail] = useState(() => currentUser?.email || 'ferdin@example.com');
  const [becomeWorkerOpen, setBecomeWorkerOpen] = useState(false);
  const [serviceSkill, setServiceSkill] = useState('Plumbing');
  const [workerApplied, setWorkerApplied] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateUserProfile({ 
      name: name.trim() || 'Ferdin', 
      city: city.trim(),
      address: city.trim(),
      email: email.trim() 
    });
    if (city.trim()) {
      localStorage.setItem('jobit_user_location', city.trim());
    }
    setIsEditing(false);
  };

  const handleApplyWorker = async (e) => {
    e.preventDefault();
    await updateUserProfile({
      role: 'worker',
      skill: serviceSkill,
      workerApproved: true
    });
    setWorkerApplied(true);
    setTimeout(() => {
      setWorkerApplied(false);
      setBecomeWorkerOpen(false);
    }, 1200);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      {/* Top Header */}
      <header className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          My Account
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Profile details & preferences
        </p>
      </header>

      {/* User Info Card */}
      <div className="px-5 py-3">
        <div className="p-4 rounded-[28px] bg-white border border-slate-200/70 shadow-xs flex items-center gap-3.5">
          <img
            src={currentUser?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
            alt="Avatar"
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 truncate">
              {currentUser?.name || "Customer"}
            </h3>
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-[#0EA5E0]" />
              <span>+91 {currentUser?.phone || "98765 43210"}</span>
            </p>
            <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0EA5E0] text-[10px] font-black">
              CUSTOMER ACCOUNT
            </div>
          </div>
        </div>
      </div>

      {/* Profile Actions */}
      <div className="px-5 space-y-2.5 mt-1">

        {/* Edit Personal Details */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-full p-4 rounded-[24px] bg-white border border-slate-200/70 hover:border-slate-300 transition flex items-center justify-between text-left shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F1F3F5] text-slate-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">Edit Profile</p>
              <p className="text-[11px] text-slate-400">{currentUser?.city || localStorage.getItem('jobit_user_location') || "Mumbai, Maharashtra"}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {isEditing && (
          <form onSubmit={handleSaveProfile} className="p-4 rounded-[24px] bg-white border border-slate-200/80 space-y-3 shadow-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4B6EF5]"
                placeholder="e.g. ferdin@example.com"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Primary Address</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4B6EF5]"
                placeholder="e.g. Melattur, Kerala"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#4B6EF5] text-white text-xs font-bold shadow-sm cursor-pointer hover:bg-[#3D5FE0] transition"
            >
              Save Changes
            </button>
          </form>
        )}

        {/* Apply as Worker Pro */}
        <button
          onClick={() => onOpenWorkerOnboarding?.()}
          className="w-full p-4 rounded-[24px] bg-white border border-slate-200/70 hover:border-slate-300 transition flex items-center justify-between text-left shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">Become a Professional</p>
              <p className="text-[11px] text-slate-400">Auto-link your customer phone & earn on JOBit</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Staff & Partner Portal (Admins & Workers) */}
        <button
          onClick={onOpenPartnerLogin}
          className="w-full p-4 rounded-[24px] bg-white border border-slate-200/70 hover:border-slate-300 transition flex items-center justify-between text-left shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">Admin & Worker Login</p>
              <p className="text-[11px] text-slate-400">Access Admin Dashboard (8289968045) or Pro Portal</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* View Splash / Welcome Screen */}
        {onViewSplash && (
          <button
            onClick={onViewSplash}
            className="w-full p-4 rounded-[24px] bg-white border border-slate-200/70 hover:border-slate-300 transition flex items-center justify-between text-left shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">Welcome Screen</p>
                <p className="text-[11px] text-slate-400">View introductory splash & hero</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* Customer Logout / Switch Account */}
        <button
          onClick={() => {
            logout();
            onOpenAuth?.();
          }}
          className="w-full p-4 rounded-[24px] bg-red-50/50 border border-red-100 text-red-500 hover:bg-red-50 transition flex items-center gap-3 text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-white text-red-500 flex items-center justify-center shadow-xs">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-600">Sign Out</p>
            <p className="text-[11px] text-red-400">Clear customer session</p>
          </div>
        </button>
      </div>

      {/* Become Worker Modal */}
      {becomeWorkerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100">
            {workerApplied ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-base font-extrabold text-slate-900">Application Submitted!</h3>
                <p className="text-xs text-slate-500 mt-1">Our admin team will review and verify your profile.</p>
              </div>
            ) : (
              <form onSubmit={handleApplyWorker} className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">Join JOBit as Pro</h3>
                <p className="text-xs text-slate-400">Choose your trade skill to get dispatched for jobs:</p>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Primary Skill</label>
                  <select
                    value={serviceSkill}
                    onChange={(e) => setServiceSkill(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Plumbing">Plumbing Expert</option>
                    <option value="AC Repair">AC Repair Specialist</option>
                    <option value="Electrician">Licensed Electrician</option>
                    <option value="Cleaning">Deep Cleaning Professional</option>
                    <option value="Painting">Wall Painting & Texturing</option>
                    <option value="Carpenter">Carpenter & Woodcraft</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBecomeWorkerOpen(false)}
                    className="flex-1 py-3 rounded-full bg-[#F1F3F5] text-slate-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-bold shadow-glow"
                  >
                    Apply Now
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
