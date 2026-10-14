import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  LogOut, 
  ShieldCheck, 
  ChevronRight,
  CheckCircle2,
  Mail,
  Edit3,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen({ 
  onOpenPartnerLogin,
  onOpenAuth, 
  onViewSplash,
  onOpenWorkerOnboarding
}) {
  const { currentUser, updateUserProfile, logout } = useAuth();
  const isLoggedIn = Boolean(currentUser && currentUser.uid);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(() => currentUser?.name || '');
  const [city, setCity] = useState(() => currentUser?.city || currentUser?.address || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala');
  const [email, setEmail] = useState(() => currentUser?.email || '');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await updateUserProfile({ 
      name: name.trim(), 
      city: city.trim(),
      address: city.trim(),
      email: email.trim() 
    });
    if (city.trim()) {
      localStorage.setItem('jobit_user_location', city.trim());
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      {/* Top Header */}
      <header className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 shadow-xs">
        <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">
          My Account
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          {isLoggedIn ? 'Profile details & preferences' : 'Sign in to access your profile'}
        </p>
      </header>

      {/* User Info Card / Guest Card */}
      <div className="px-5 py-3">
        {isLoggedIn ? (
          <div className="p-4 rounded-[28px] bg-white border border-slate-200/70 shadow-xs flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1528] text-white flex items-center justify-center overflow-hidden ring-2 ring-[#1E3A8A] shrink-0">
              {currentUser?.photo ? (
                <img
                  src={currentUser.photo}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-black text-white">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 truncate">
                {currentUser?.name || 'Customer'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-[#0EA5E0]" />
                <span>{currentUser?.phone || ''}</span>
              </p>
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0EA5E0] text-[10px] font-black">
                {currentUser?.role === 'admin' ? 'ADMIN' : (currentUser?.role === 'worker' ? 'VERIFIED PRO' : 'CUSTOMER ACCOUNT')}
              </div>
            </div>
          </div>
        ) : (
          /* Unauthenticated Guest Card */
          <div className="p-4 rounded-[28px] bg-[#0B1528] text-white shadow-md flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#16233B] ring-2 ring-[#1E3A8A] flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-[#93C5FD]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Guest User</h3>
                <p className="text-xs text-slate-300">Sign in to book and manage home services</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2.5 rounded-xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Login / Sign Up with Mobile</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Actions */}
      <div className="px-5 space-y-2.5 mt-1">

        {/* Edit Personal Details (Only if Logged In) */}
        {isLoggedIn && (
          <>
            <button
              onClick={() => {
                setName(currentUser?.name || '');
                setCity(currentUser?.city || currentUser?.address || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala');
                setEmail(currentUser?.email || '');
                setIsEditing(!isEditing);
              }}
              className="w-full p-4 rounded-[24px] bg-white border border-slate-200/70 hover:border-slate-300 transition flex items-center justify-between text-left shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B1528] text-white flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Edit Profile</p>
                  <p className="text-[11px] text-slate-400">{currentUser?.city || localStorage.getItem('jobit_user_location') || "Melattur, Kerala"}</p>
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                    placeholder="e.g. yourname@example.com"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Primary Address</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                    placeholder="e.g. Melattur, Kerala"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#0EA5E0] text-white text-xs font-bold shadow-sm cursor-pointer hover:bg-[#0284C7] transition"
                >
                  Save Changes
                </button>
              </form>
            )}
          </>
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
              <p className="text-xs font-extrabold text-slate-800">Switch to Pro / Become a Professional</p>
              <p className="text-[11px] text-slate-400">Register as service worker & manage jobs</p>
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
              <p className="text-xs font-extrabold text-slate-800">Admin & Partner Login</p>
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
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="w-full p-4 rounded-[24px] bg-red-50/50 border border-red-100 text-red-500 hover:bg-red-50 transition flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-white text-red-500 flex items-center justify-center shadow-xs">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-600">Logout</p>
              <p className="text-[11px] text-red-400">Clear customer session & return to guest</p>
            </div>
          </button>
        )}
      </div>

    </div>
  );
}
