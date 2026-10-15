import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Sparkles, 
  Bell, 
  CheckCircle2, 
  Briefcase, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { ROLLOUT_LOCATIONS } from '../../data/bookingService';

export function ComingSoonCategoryModal({
  isOpen,
  onClose,
  category,
  currentLocation = 'Melattur, Kerala',
  onSwitchLocation,
  onOpenWorkerOnboarding
}) {
  const [notified, setNotified] = useState(false);

  if (!isOpen || !category) return null;

  const categoryName = typeof category === 'string' 
    ? category 
    : (category?.name || category?.title || 'This Service');
  
  const categoryIcon = typeof category === 'object' ? (category?.icon || '🛠️') : '🛠️';
  const cleanLocation = (currentLocation || 'your area').split(',')[0].trim();

  // Pick other rollout areas for quick 1-tap switch
  const alternateLocations = ROLLOUT_LOCATIONS.filter(
    loc => !loc.toLowerCase().includes(cleanLocation.toLowerCase())
  );

  const handleNotifyMe = () => {
    setNotified(true);
    setTimeout(() => {
      setNotified(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 flex flex-col items-center text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Category Icon with Floating Area Badge */}
        <div className="relative mt-2 mb-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-sm">
            {categoryIcon}
          </div>
          <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Soon</span>
          </div>
        </div>

        {/* Location Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold mb-2">
          <MapPin className="w-3.5 h-3.5 text-[#0EA5E0]" />
          <span>{cleanLocation}</span>
        </div>

        {/* Main Heading & Required Copy */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
          Coming Soon to Your Area!
        </h3>

        <p className="text-xs text-slate-600 font-semibold mt-1.5 leading-relaxed max-w-xs">
          We are onboarding top local professionals in <strong className="text-slate-900">{cleanLocation}</strong> soon.
        </p>

        {/* Verification Standards Notice */}
        <div className="mt-3.5 p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-left text-xs space-y-1 w-full">
          <div className="flex items-center gap-1.5 text-sky-800 font-extrabold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#0EA5E0]" />
            <span>JOBit Quality Guarantee</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            Every trade is made available only after technicians complete background checks and trade skill verification.
          </p>
        </div>

        {/* Notification Toast or Action Button */}
        {notified ? (
          <div className="w-full mt-4 py-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>We'll notify you as soon as {categoryName} is live in {cleanLocation}!</span>
          </div>
        ) : (
          <div className="w-full space-y-2 mt-4">
            <button
              onClick={handleNotifyMe}
              className="w-full py-3 px-4 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notify Me When Live</span>
            </button>

            {/* Quick Switch to Other Rollout Areas */}
            {alternateLocations.length > 0 && onSwitchLocation && (
              <div className="pt-2 text-left w-full border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 text-center">
                  Or check nearby live locations
                </p>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {alternateLocations.map((loc) => {
                    const shortName = loc.split(',')[0].trim();
                    return (
                      <button
                        key={loc}
                        onClick={() => {
                          onSwitchLocation(loc);
                          onClose();
                        }}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#0EA5E0] border border-slate-200/80 text-[11px] font-bold transition cursor-pointer text-center truncate"
                      >
                        Switch to {shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Become a Pro Link */}
            {onOpenWorkerOnboarding && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWorkerOnboarding(cleanLocation, categoryName);
                }}
                className="w-full py-2 px-3 text-slate-500 hover:text-emerald-700 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Briefcase className="w-3 h-3 text-emerald-600" />
                <span>Are you a technician in {cleanLocation}? Apply to join!</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
