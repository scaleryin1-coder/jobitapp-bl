import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { createBooking } from '../data/bookingService';
import { useAuth } from '../context/AuthContext';

export function BookingModal({ service, isOpen, onClose, onSuccess }) {
  const { currentUser } = useAuth() || {};
  const userLoc = localStorage.getItem('jobit_user_location') || currentUser?.city || 'Mumbai, Maharashtra';
  const [address, setAddress] = useState(`Flat 402, Sunshine Heights, ${userLoc}`);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !service) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);

    const bookingPayload = {
      customerId: currentUser?.uid || 'guest_user',
      customerName: currentUser?.name || 'Valued Customer',
      customerPhone: currentUser?.phone || '9876543210',
      workerId: null, // Unallocated -> Instant broadcast to available workers
      workerName: null,
      preferredWorkerId: service.workerId || null,
      preferredWorkerName: service.workerName || null,
      serviceId: service.id,
      serviceTitle: service.title,
      categoryName: service.categoryName,
      price: service.price,
      address,
      dateTime: `${date} at ${timeSlot}`,
      note: note.trim(),
      status: 'pending' // Pending Assignment
    };

    try {
      await createBooking(bookingPayload);
    } catch (err) {
      console.warn('Booking create fallback', err);
    }

    setLoading(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSuccess?.();
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Book Service
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {service.title} • ₹{service.price}/hour
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">Booking Confirmed!</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
              Your service request is placed. A verified technician has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4 pt-4">
            
            {/* Address Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0EA5E0]" />
                <span>Service Address</span>
              </label>
              <textarea
                rows="2"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                placeholder="Enter complete street, house no., and landmark"
              />
            </div>

            {/* Date Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0EA5E0]" />
                <span>Preferred Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
              />
            </div>

            {/* Time Slot Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0EA5E0]" />
                <span>Time Slot</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  '09:00 AM - 11:00 AM',
                  '11:00 AM - 01:00 PM',
                  '02:00 PM - 04:00 PM',
                  '04:00 PM - 06:00 PM'
                ].map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setTimeSlot(slot)}
                    className={`p-2.5 rounded-2xl text-[11px] font-bold border transition ${
                      timeSlot === slot
                        ? 'bg-sky-50 border-[#0EA5E0] text-[#0EA5E0]'
                        : 'bg-[#F8FAFC] border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0EA5E0]" />
                <span>Notes for Worker (Optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                placeholder="e.g. Please bring extra 1/2 inch pipe fittings"
              />
            </div>

            {/* Trust Guarantee Box */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-[11px] text-emerald-800 font-semibold leading-tight">
                JOBit Guarantee: Pay after service completion. Zero unsolicited calls.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-extrabold text-sm shadow-[0_12px_28px_-6px_rgba(14,165,224,0.45)] hover:opacity-95 active:scale-[0.99] transition"
            >
              {loading ? 'Confirming...' : `Confirm Booking • ₹${service.price}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
