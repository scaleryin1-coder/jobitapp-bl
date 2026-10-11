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
  Zap,
  Power
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase';

export function ProfileScreen({ 
  onOpenAdmin, 
  onOpenWorker, 
  onOpenAuth, 
  onViewSplash,
  currentRole = 'customer',
  onSwitchRole
}) {
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
      workerApproved: true
    });
    setWorkerApplied(true);
    setTimeout(() => {
      setWorkerApplied(false);
      setBecomeWorkerOpen(false);
      onSwitchRole?.('worker');
    }, 1200);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      {/* Top Header */}
      <header className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          My Profile & Roles
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Account preferences & multi-role dashboard switching
        </p>
      </header>

      {/* Role Switcher Floating Header Card */}
      <div className="px-5 py-3">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-4 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
              Active Persona / Role View
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              Instant Switch
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/10 rounded-2xl">
            <button
              onClick={() => onSwitchRole?.('customer')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                currentRole === 'customer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>🧑 Customer</span>
              <span className="text-[9px] font-semibold text-slate-400">Booking</span>
            </button>

            <button
              onClick={() => {
                onSwitchRole?.('worker');
                onOpenWorker?.();
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                currentRole === 'worker'
                  ? 'bg-[#0EA5E0] text-white shadow-sm'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>👷 Pro Worker</span>
              <span className="text-[9px] font-semibold text-sky-200">Dispatch</span>
            </button>

            <button
              onClick={() => {
                onSwitchRole?.('admin');
                onOpenAdmin?.();
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>⚡ Admin</span>
              <span className="text-[9px] font-semibold text-purple-200">Control</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="px-5 py-1">
        <div className="p-4 rounded-[28px] bg-white border border-slate-200/70 shadow-xs flex items-center gap-3.5">
          <img
            src={currentUser?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
            alt="Avatar"
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 truncate">
              {currentUser?.name || "Customer User"}
            </h3>
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-[#0EA5E0]" />
              <span>+91 {currentUser?.phone || "98765 43210"}</span>
            </p>
            <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0EA5E0] text-[10px] font-black">
              {currentRole === 'admin' ? 'ADMINISTRATOR' : currentRole === 'worker' ? 'TECHNICIAN PRO' : 'CUSTOMER CLIENT'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Actions */}
      <div className="px-5 space-y-2.5 mt-3">

        {/* Worker Dashboard Action */}
        <button
          onClick={() => {
            onSwitchRole?.('worker');
            onOpenWorker?.();
          }}
          className="w-full p-4 rounded-[24px] bg-white border border-sky-200 hover:border-[#0EA5E0] transition flex items-center justify-between text-left shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 group-hover:text-[#0EA5E0] transition">
                Worker Pro Dashboard
              </p>
              <p className="text-[11px] text-slate-400">Duty toggle, alert radar & job actions</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-extrabold px-2 py-0.5 rounded-full">
              LIVE RADAR
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        {/* Admin Dashboard Access */}
        <button
          onClick={() => {
            onSwitchRole?.('admin');
            onOpenAdmin?.();
          }}
          className="w-full p-4 rounded-[24px] bg-white border border-purple-200 hover:border-purple-500 transition flex items-center justify-between text-left shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 group-hover:text-purple-600 transition">
                Admin Control Center
              </p>
              <p className="text-[11px] text-slate-400">Fleet dispatch, manual assign & catalog</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-purple-50 text-purple-600 font-extrabold px-2 py-0.5 rounded-full">
              MASTER
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>

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
              <p className="text-[11px] text-slate-400">{currentUser?.city || "Celina, Delaware"}</p>
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
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Current City / Location</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </form>
        )}

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

        {/* Logout */}
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
            <p className="text-[11px] text-red-400">Clear active login session</p>
          </div>
        </button>
      </div>

    </div>
  );
}
