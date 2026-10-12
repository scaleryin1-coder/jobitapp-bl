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
  // Extract user first name or fallback cleanly
  const displayName = currentUser?.name
    ? currentUser.name.split(' ')[0]
    : 'Ferdin';

  const userPhoto = currentUser?.photo || currentUser?.avatar;

  return (
    <header className="px-5 pt-4 pb-2 flex items-center justify-between">
      {/* Left: Interactive User Avatar & Info Header */}
      <div className="flex items-center gap-3">
        {/* Profile Avatar Button */}
        <button 
          type="button"
          onClick={onOpenProfileDrawer}
          title="View & Edit Profile Details"
          className="relative w-11 h-11 rounded-full ring-2 ring-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden shrink-0 bg-[#E0E7FF] flex items-center justify-center cursor-pointer active:scale-95 transition hover:ring-[#4B6EF5]/40"
        >
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#C9D6FF] to-[#BFF5E3] flex items-center justify-center text-[#4B6EF5] font-black text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* User Greeting & Location */}
        <div>
          <button
            type="button"
            onClick={onOpenProfileDrawer}
            className="text-[15px] font-black text-[#111827] tracking-tight leading-tight hover:text-[#4B6EF5] transition-colors cursor-pointer text-left block active:scale-98"
            title="Open Profile Card"
          >
            Hello, {displayName}
          </button>
          <button
            onClick={onOpenLocationPicker}
            className="flex items-center gap-1 mt-0.5 group text-left cursor-pointer transition active:scale-95"
            title="Change Location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#4B6EF5] transition-colors shrink-0" />
            <span className="text-xs text-[#9CA3AF] group-hover:text-[#111827] font-medium truncate max-w-[170px] sm:max-w-[210px] transition-colors">
              {locationName}
            </span>
          </button>
        </div>
      </div>

      {/* Right: Notification Bell Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNotifications}
          className="w-11 h-11 rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,0.04)] border border-white hover:shadow-md transition active:scale-95 flex items-center justify-center relative cursor-pointer shrink-0"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#111827] stroke-[2]" />
          {unreadNotifCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#4B6EF5] absolute top-2.5 right-2.5 ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
}
