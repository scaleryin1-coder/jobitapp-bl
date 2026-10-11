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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase';

export function ProfileScreen({ onOpenAdmin, onOpenAuth, onViewSplash }) {
  const { currentUser, updateUserProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || 'Customer');
  const [city, setCity] = useState(currentUser?.city || 'Celina, Delaware');
  const [becomeWorkerOpen, setBecomeWorkerOpen] = useState(false);
  const [serviceSkill, setServiceSkill] = useState('Plumbing');
  const [workerApplied, setWorkerApplied] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateUserProfile({ name, city });
    setIsEditing(false);
  };

  const handleApplyWorker = async (e) => {
    e.preventDefault();
    await updateUserProfile({
      role: 'worker',
      skill: serviceSkill,
      workerApproved: false
    });
    setWorkerApplied(true);
    setTimeout(() => {
      setWorkerApplied(false);
      setBecomeWorkerOpen(false);
    }, 1800);
  };

  return (
    <div className="w-full min-h-screen bg-white pb-28 text-slate-900 select-none">
      
      {/* Top Header */}
      <header className="px-5 pt-4 pb-3">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Account details and preferences
        </p>
      </header>

      {/* User Info Card */}
      <div className="px-5 py-2">
        <div className="p-5 rounded-[28px] bg-slate-50 border border-slate-100 flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-sm"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 truncate">
              {currentUser?.name || "Customer"}
            </h3>
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-[#0EA5E0]" />
              <span>+91 {currentUser?.phone || "9876543210"}</span>
            </p>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-sky-100/70 text-[#0EA5E0] text-[10px] font-extrabold">
              {currentUser?.role === 'admin' ? 'SYSTEM ADMIN' : currentUser?.role === 'worker' ? 'SERVICE PRO' : 'CUSTOMER'}
            </div>
          </div>
        </div>
      </div>

      {!isFirebaseConfigured && (
        <div className="px-5 my-2">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Firebase not configured (profile stored in browser memory)</span>
          </div>
        </div>
      )}

      {/* Profile Actions */}
      <div className="px-5 space-y-2.5 mt-2">

        {/* Edit Personal Details */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-full p-4 rounded-[22px] bg-white border border-slate-100 hover:border-slate-200 transition flex items-center justify-between text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F1F3F5] text-slate-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Edit Profile</p>
              <p className="text-[11px] text-slate-400">{currentUser?.city || "Celina, Delaware"}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {isEditing && (
          <form onSubmit={handleSaveProfile} className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Current City / Location</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-bold shadow-sm"
            >
              Save Changes
            </button>
          </form>
        )}

        {/* Become a Worker */}
        <button
          onClick={() => setBecomeWorkerOpen(true)}
          className="w-full p-4 rounded-[22px] bg-white border border-slate-100 hover:border-slate-200 transition flex items-center justify-between text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Become a Verified Pro</p>
              <p className="text-[11px] text-slate-400">Offer your skills & earn hourly</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Admin Dashboard Access */}
        <button
          onClick={onOpenAdmin}
          className="w-full p-4 rounded-[22px] bg-white border border-slate-100 hover:border-slate-200 transition flex items-center justify-between text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Admin Control Panel</p>
              <p className="text-[11px] text-slate-400">Manage categories, banners & workers</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* View Splash / Welcome Screen */}
        {onViewSplash && (
          <button
            onClick={onViewSplash}
            className="w-full p-4 rounded-[22px] bg-white border border-slate-100 hover:border-slate-200 transition flex items-center justify-between text-left shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-50 text-[#0EA5E0] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Welcome Screen</p>
                <p className="text-[11px] text-slate-400">View introductory splash & hero</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            onOpenAuth?.();
          }}
          className="w-full p-4 rounded-[22px] bg-red-50/50 border border-red-100 text-red-500 hover:bg-red-50 transition flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-white text-red-500 flex items-center justify-center shadow-xs">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-600">Sign Out</p>
            <p className="text-[11px] text-red-400">Clear active login session</p>
          </div>
        </button>
      </div>

      {/* Become Worker Modal */}
      {becomeWorkerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl relative border border-slate-100">
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
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
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
