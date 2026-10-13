import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  LogOut, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Edit3,
  Sparkles,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfileDrawerModal({ isOpen, onClose, onLogoutComplete, onOpenWorkerOnboarding }) {
  const { currentUser, updateUserProfile, logout } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state whenever drawer opens or user changes
  useEffect(() => {
    if (isOpen) {
      const defaultName = currentUser?.name || 'Ferdin';
      const defaultPhone = currentUser?.phone || '+91 98765 43210';
      const defaultAddress = currentUser?.city || currentUser?.address || localStorage.getItem('jobit_user_location') || 'Melattur, Kerala';
      const defaultEmail = currentUser?.email || `${defaultName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'ferdin'}@example.com`;

      setName(defaultName);
      setPhone(defaultPhone);
      setAddress(defaultAddress);
      setEmail(defaultEmail);
      setIsEditing(false);
      setIsSaved(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);

    try {
      await updateUserProfile({
        name: name.trim() || 'Ferdin',
        email: email.trim(),
        city: address.trim(),
        address: address.trim()
      });

      // Keep location in sync in local storage
      if (address.trim()) {
        localStorage.setItem('jobit_user_location', address.trim());
      }

      setIsSaved(true);
      setIsEditing(false);
      setTimeout(() => {
        setIsSaved(false);
      }, 2500);
    } catch (err) {
      console.warn('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    onLogoutComplete?.();
  };

  const displayName = name || currentUser?.name || 'Ferdin';
  const userPhoto = currentUser?.photo || currentUser?.avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Floating Profile Card Modal */}
      <div 
        className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Top Header & Avatar Profile Display */}
        <div className="flex flex-col items-center text-center pt-2 pb-4 border-b border-slate-100">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full ring-4 ring-[#4B6EF5]/15 shadow-md overflow-hidden bg-gradient-to-br from-[#E0E7FF] to-[#D5E1FF] flex items-center justify-center">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-[#4B6EF5]">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 ring-2 ring-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs" title="Verified Customer">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>

          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {displayName}
          </h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            {phone}
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF0FF] text-[#4B6EF5] text-[11px] font-extrabold tracking-wide">
            <Sparkles className="w-3 h-3 text-[#4B6EF5]" />
            <span>JOBit Single Account</span>
          </div>
        </div>

        {/* Success Alert */}
        {isSaved && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Changes saved successfully!</span>
          </div>
        )}

        {/* Profile Details & Form */}
        <div className="mt-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Account Information
            </h4>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-[#4B6EF5] hover:text-[#3D5FE0] flex items-center gap-1 cursor-pointer transition active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : 'Edit Details'}</span>
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3 pt-1">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#4B6EF5]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4B6EF5] focus:bg-white transition"
                  placeholder="e.g. Ferdin"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#4B6EF5]" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4B6EF5] focus:bg-white transition"
                  placeholder="e.g. ferdin@example.com"
                />
              </div>

              {/* Mobile Number (Read-only / strict binding) */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#4B6EF5]" />
                  <span>Linked Mobile Number</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={phone}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Strict single-account mobile linkage</p>
              </div>

              {/* Primary Address */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#4B6EF5]" />
                  <span>Primary Address</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4B6EF5] focus:bg-white transition"
                  placeholder="e.g. Melattur, Kerala"
                />
              </div>

              {/* Save Changes Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full mt-2 py-3 rounded-full bg-[#4B6EF5] hover:bg-[#3D5FE0] text-white font-extrabold text-xs shadow-[0_8px_20px_-4px_rgba(75,110,245,0.4)] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-2.5 pt-1">
              {/* Full Name Display */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-[#4B6EF5] flex items-center justify-center shadow-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Full Name</p>
                  <p className="text-xs font-extrabold text-slate-800 truncate">{displayName}</p>
                </div>
              </div>

              {/* Mobile Number Display */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-[#4B6EF5] flex items-center justify-center shadow-xs shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Logged-in Mobile Number</p>
                  <p className="text-xs font-extrabold text-slate-800 truncate">{phone}</p>
                </div>
              </div>

              {/* Primary Address Display */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-[#4B6EF5] flex items-center justify-center shadow-xs shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Primary Address</p>
                  <p className="text-xs font-extrabold text-slate-800 truncate">{address}</p>
                </div>
              </div>

              {/* Email Display */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-[#4B6EF5] flex items-center justify-center shadow-xs shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                  <p className="text-xs font-extrabold text-slate-800 truncate">{email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Become a Professional Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          {onOpenWorkerOnboarding && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWorkerOnboarding();
              }}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 text-emerald-800 transition flex items-center justify-between text-left cursor-pointer active:scale-98 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-950">Become a Professional</p>
                  <p className="text-[10px] text-emerald-700/80 font-bold">Auto-link account & start earning</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100/80 text-red-600 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-red-100"
          >
            <LogOut className="w-4 h-4 stroke-[2.2]" />
            <span>Logout Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
