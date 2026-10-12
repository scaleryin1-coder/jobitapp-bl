import React from 'react';
import { Home, Calendar, MessageCircle, User } from 'lucide-react';

export function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home
    },
    {
      id: 'bookings',
      label: 'Booking',
      icon: Calendar
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageCircle
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User
    }
  ];

  return (
    <nav className="fixed sm:absolute inset-x-0 bottom-0 z-40 bg-white rounded-t-[28px] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] border-t border-slate-100/60 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition active:scale-95 group"
            title={tab.label}
          >
            <div
              className={`transition-colors duration-200 ${
                isActive ? 'text-[#4B6EF5]' : 'text-[#9CA3AF] group-hover:text-slate-600'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 ${
                  isActive ? 'stroke-[2.5] fill-[#4B6EF5]/15' : 'stroke-[2]'
                }`}
              />
            </div>
            <span
              className={`text-[11px] transition-colors duration-200 ${
                isActive
                  ? 'font-bold text-[#4B6EF5]'
                  : 'font-medium text-[#9CA3AF] group-hover:text-slate-600'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
