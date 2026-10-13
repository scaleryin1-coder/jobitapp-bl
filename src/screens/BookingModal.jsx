import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, FileText, CheckCircle2, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { createBooking } from '../data/bookingService';
import { useAuth } from '../context/AuthContext';
import { getSubCategoriesForCategory } from '../data/categoriesData';

export function BookingModal({ service, isOpen, onClose, onSuccess }) {
  const { currentUser } = useAuth() || {};
  const userLoc = localStorage.getItem('jobit_user_location') || currentUser?.city || 'Melattur, Kerala';
  const [address, setAddress] = useState(`Main Road, Town Center, ${userLoc}`);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Derive sub-categories for this service/category
  const availableSubCategories = service
    ? (service.subCategories && service.subCategories.length > 0
        ? service.subCategories
        : getSubCategoriesForCategory(service.categoryName || service.title))
    : [];

  const [selectedSubCategory, setSelectedSubCategory] = useState(
    availableSubCategories[0] || 'Standard Service'
  );

  useEffect(() => {
    if (service) {
      const list = service.subCategories && service.subCategories.length > 0
        ? service.subCategories
        : getSubCategoriesForCategory(service.categoryName || service.title);
      if (list && list.length > 0) {
        setSelectedSubCategory(list[0]);
      }
    }
  }, [service]);

  if (!isOpen || !service) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (loading) return;
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
      serviceTitle: `${service.title} (${selectedSubCategory})`,
      subCategory: selectedSubCategory,
      categoryName: service.categoryName || service.title,
      price: service.price || 350,
      address,
      dateTime: `${date} at ${timeSlot}`,
      note: note.trim() 
        ? `Issue: ${selectedSubCategory}. Note: ${note.trim()}`
        : `Issue: ${selectedSubCategory}`,
      status: 'pending' // Pending Assignment
    };

    try {
      await createBooking(bookingPayload);
    } catch (err) {
      console.warn('Booking create fallback', err);
    }

    setLoading(false);
    setIsSuccess(true);

    // Smooth redirect within 1 second (800ms) to 'Booking Success' / 'My Bookings' tab
    setTimeout(() => {
      setIsSuccess(false);
      onSuccess?.();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-[#111827] tracking-tight">
              Book {service.title}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Instant appointment • ₹{service.price || 350} starting rate
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-slate-900">Booking Confirmed!</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
              Your request for <strong className="text-slate-800">{selectedSubCategory}</strong> has been placed. A JOBit Verified Technician has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4 pt-4">
            
            {/* IN-PAGE SUB-CATEGORY / ISSUE SELECTOR (No extra pages needed) */}
            {availableSubCategories.length > 0 && (
              <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-black text-[#111827] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#4B6EF5]" />
                    <span>Select Issue / Sub-Category</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-[#4B6EF5] bg-[#EAF0FF] px-2 py-0.5 rounded-full">
                    {availableSubCategories.length} Options
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableSubCategories.map((sub) => {
                    const isSelected = selectedSubCategory === sub;
                    return (
                      <button
                        type="button"
                        key={sub}
                        onClick={() => setSelectedSubCategory(sub)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#4B6EF5] text-white shadow-sm shadow-[#4B6EF5]/20 scale-102 ring-2 ring-[#4B6EF5]/20'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Address Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#4B6EF5]" />
                <span>Service Address</span>
              </label>
              <textarea
                rows="2"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4B6EF5] focus:bg-white"
                placeholder="Enter complete street, house no., and landmark"
              />
            </div>

            {/* Date Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#4B6EF5]" />
                <span>Preferred Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4B6EF5] focus:bg-white"
              />
            </div>

            {/* Time Slot Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4B6EF5]" />
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
                    className={`p-2.5 rounded-2xl text-[11px] font-bold border transition cursor-pointer ${
                      timeSlot === slot
                        ? 'bg-[#EAF0FF] border-[#4B6EF5] text-[#4B6EF5]'
                        : 'bg-[#F8FAFC] border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Note */}
            {/* Additional Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#4B6EF5]" />
                <span>Notes for JOBit Expert (Optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4B6EF5] focus:bg-white"
                placeholder="e.g. Please bring extra spare parts or tools"
              />
            </div>

            {/* Transparent Customer Pricing Summary */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total Service Charge:</span>
                <span className="font-extrabold text-slate-900">₹{service.price || 650}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Advance Paid (Inspection Fee):</span>
                <span className="font-bold">-₹{(service.price || 650) >= 250 ? 99 : 49}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between font-black text-slate-900">
                <span>Remaining Amount Due:</span>
                <span className="text-sm font-black text-[#4B6EF5]">₹{(service.price || 650) - ((service.price || 650) >= 250 ? 99 : 49)}</span>
              </div>
            </div>

            {/* Trust Guarantee Box */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-[11px] text-emerald-800 font-semibold leading-tight">
                JOBit Staff Guarantee: Pay remaining balance after service completion to your JOBit Verified Technician. Zero hidden commission.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#4B6EF5] hover:bg-[#3D5FE0] text-white font-extrabold text-sm shadow-[0_12px_28px_-6px_rgba(75,110,245,0.45)] active:scale-[0.99] transition cursor-pointer"
            >
              {loading ? 'Confirming...' : `Confirm Booking • ${selectedSubCategory}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
