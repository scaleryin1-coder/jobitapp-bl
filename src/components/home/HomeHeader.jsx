import React from 'react';
import { MapPin, Bell, User as UserIcon } from 'lucide-react';

export function HomeHeader({
  currentUser,
  locationName = 'Melattur, Kerala',
  onOpenLocationPicker,
  onOpenNotifications,
  onOpenProfileDrawer,
  unreadNotifCount = 0
}) {
  const isLoggedIn = Boolean(currentUser && currentUser.uid);
  const displayName = isLoggedIn && currentUser?.name
    ? currentUser.name.split(' ')[0]
    : null;

  const userPhoto = currentUser?.photo || currentUser?.avatar;

  return (
    <header className="px-5 pt-4 pb-2.5 flex items-center justify-between">
      {/* Left: Profile Icon / Avatar & Clean Location Detail */}
      <div className="flex items-center gap-3">
        {/* Profile Avatar Button in Primary Navy Blue Theme */}
        <button
          type="button"
          onClick={onOpenProfileDrawer}
          title={isLoggedIn ? `${currentUser.name} - Open Profile` : 'Sign In / Profile'}
          className="relative w-11 h-11 rounded-2xl bg-[#0B1528] text-white ring-2 ring-[#1E3A8A]/50 shadow-[0_4px_14px_rgba(11,21,40,0.25)] flex items-center justify-center cursor-pointer active:scale-95 transition-all hover:ring-[#4B6EF5] group overflow-hidden shrink-0"
        >
          {isLoggedIn ? (
            userPhoto ? (
              <img
                src={userPhoto}
                alt={displayName || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="font-black text-sm tracking-wide text-white group-hover:scale-105 transition-transform">
                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
              </span>
            )
          ) : (
            <div className="flex flex-col items-center justify-center">
              <UserIcon className="w-5 h-5 text-white stroke-[2.2] group-hover:scale-110 transition-transform" />
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#0EA5E0] ring-2 ring-[#0B1528]" />
            </div>
          )}
        </button>

        {/* Location & Name Details */}
        <div className="flex flex-col items-start text-left">
          {isLoggedIn && displayName ? (
            <button
              type="button"
              onClick={onOpenProfileDrawer}
              className="text-[14px] font-black text-[#0B1528] tracking-tight hover:text-[#1E3A8A] transition-colors cursor-pointer leading-tight active:scale-98 truncate max-w-[150px] sm:max-w-[190px]"
              title="Open Profile"
            >
              {displayName}
            </button>
          ) : null}

          {/* Clean Location Detail */}
          <button
            type="button"
            onClick={onOpenLocationPicker}
            className="flex items-center gap-1 mt-0.5 group cursor-pointer transition active:scale-95 px-2 py-0.5 rounded-full bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/60"
            title="Change Location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#0EA5E0] shrink-0" />
            <span className="text-xs text-slate-600 group-hover:text-[#0B1528] font-bold truncate max-w-[130px] sm:max-w-[180px] transition-colors">
              {locationName}
            </span>
          </button>
        </div>
      </div>

      {/* Right: Notification Bell Icon cleanly placed on the far right */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpenNotifications}
          className="w-11 h-11 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-md transition active:scale-95 flex items-center justify-center relative cursor-pointer text-slate-700 hover:text-[#0B1528]"
          title="Notifications"
        >
          <Bell className="w-5 h-5 stroke-[2.2]" />
          {unreadNotifCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E0] absolute top-2.5 right-2.5 ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
}
