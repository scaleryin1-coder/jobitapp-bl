import React, { useState, useEffect } from 'react';
import { X, Bell, ShieldCheck, Tag, Trash2, Clock, CheckCircle2, Check, Sparkles } from 'lucide-react';
import { getLocalBookings } from '../data/bookingService';

const STORAGE_KEY_NOTIFS = 'jobit_customer_notifications';

export function NotificationModal({ isOpen, onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch {}

    // Default clean initial notification items
    return [
      {
        id: 'notif_welcome',
        title: 'Welcome to JOBIT!',
        message: 'Get 20% off your first certified home repair booking with code JOBIT20.',
        time: 'Just now',
        unread: true,
        type: 'promo',
        badge: 'Offer'
      },
      {
        id: 'notif_guarantee',
        title: '100% Verified Trade Guarantee',
        message: 'All technicians dispatched in your local area have passed strict background and trade verification.',
        time: '2h ago',
        unread: true,
        type: 'safety',
        badge: 'Verified'
      }
    ];
  });

  // Keep unread count in sync with parent dashboard
  useEffect(() => {
    const unread = notifications.filter(n => n.unread).length;
    onUnreadChange?.(unread);
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch {}
  }, [notifications, onUnreadChange]);

  // Synchronize dynamic booking alerts when modal opens
  useEffect(() => {
    if (!isOpen) return;

    try {
      const bookings = getLocalBookings() || [];
      const activeBookings = bookings.slice(0, 3);

      setNotifications((prev) => {
        const existingIds = new Set(prev.map(p => p.id));
        const newNotifs = [...prev];

        activeBookings.forEach((b) => {
          const bookingNotifId = `booking_alert_${b.id}_${b.status}`;
          if (!existingIds.has(bookingNotifId)) {
            let title = `Booking: ${b.serviceTitle}`;
            let message = `Status: ${b.status?.toUpperCase()}. Scheduled for ${b.dateTime || 'today'}.`;
            let badge = 'Dispatch';

            if (b.status === 'confirmed' || b.status === 'pending') {
              message = `Booking Confirmed! Technician ${b.workerName || 'Rajesh Sharma'} assigned for your visit.`;
              badge = 'Confirmed';
            } else if (b.status === 'accepted') {
              message = `Technician ${b.workerName || 'allocated'} accepted your job request.`;
              badge = 'Assigned';
            } else if (b.status === 'on_the_way') {
              message = `Technician is en route to your address.`;
              badge = 'On Way';
            } else if (b.status === 'completed') {
              message = `Service marked complete and payment settled.`;
              badge = 'Completed';
            }

            newNotifs.unshift({
              id: bookingNotifId,
              title,
              message,
              time: 'Recent',
              unread: true,
              type: 'booking',
              badge
            });
          }
        });

        return newNotifs;
      });
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    setNotifications([]);
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify([]));
    } catch {}
    onUnreadChange?.(0);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, unread: false }));
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    onUnreadChange?.(0);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                {unreadCount > 0 ? `${unreadCount} new update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition px-2 py-1 rounded-lg cursor-pointer"
                title="Clear all notifications"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#F1F3F5] text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-3 flex-1 overflow-y-auto no-scrollbar space-y-2.5">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-2xl border transition relative ${
                  notif.unread
                    ? 'bg-sky-50/60 border-sky-200/80 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'safety' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : notif.type === 'promo'
                      ? 'bg-sky-50 text-[#0EA5E0] border-sky-100'
                      : 'bg-purple-50 text-purple-600 border-purple-100'
                  }`}>
                    {notif.type === 'safety' && <ShieldCheck className="w-4 h-4" />}
                    {notif.type === 'promo' && <Tag className="w-4 h-4" />}
                    {notif.type === 'booking' && <Clock className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {notif.title}
                        </h4>
                        {notif.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E0] shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                        {notif.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.badge && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-600">
                        {notif.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Clean Empty State */
            <div className="py-12 text-center px-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-1">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800">No Notifications Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                You're all caught up! Real-time booking dispatches, technician arrival alerts, and offers will appear right here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="pt-2 border-t border-slate-100 shrink-0">
            <button
              onClick={handleMarkAllRead}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
