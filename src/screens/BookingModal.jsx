import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Phone, 
  User, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';
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
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  // Derive sub-categories for this service/category
  const availableSubCategories = service
    ? (service.subCategories && service.subCategories.length > 0
        ? service.subCategories
        : getSubCategoriesForCategory(service.categoryName || service.title))
    : [];

  const [selectedSubCategory, setSelectedSubCategory] = useState(
    availableSubCategories[0] || 'Standard Inspection & Service'
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

  // Clean state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmedBookingData(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !service) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const bookingPayload = {
      customerId: currentUser?.uid || 'guest_user',
      customerName: currentUser?.name || 'Valued Customer',
      customerPhone: currentUser?.phone || '9876543210',
      workerId: service.workerId || 'worker_rajesh',
      workerName: service.workerName || 'Rajesh Sharma',
      workerTitle: 'JOBit Verified Technician',
      workerPhone: service.workerPhone || '98765 43210',
      workerAvatar: service.workerAvatar || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80',
      serviceId: service.id,
      serviceTitle: `${service.title} (${selectedSubCategory})`,
      subCategory: selectedSubCategory,
      categoryName: service.categoryName || service.title,
      price: 99,
      visitingFee: 99,
      totalServiceCharge: 99,
      totalWorkFee: 99,
      advancePaid: 99,
      remainingDue: 0,
      address,
      dateTime: `${date} at ${timeSlot}`,
      note: note.trim() 
        ? `Issue: ${selectedSubCategory}. Note: ${note.trim()}`
        : `Issue: ${selectedSubCategory}`,
      status: 'confirmed', // Active Status: Booking Confirmed - Technician Assigned
      paymentStatus: 'paid_visiting_fee_99',
      paymentId: 'pay_' + Date.now()
    };

    let result = null;
    try {
      result = await createBooking(bookingPayload);
    } catch (err) {
      console.warn('Booking create fallback', err);
      result = { ...bookingPayload, id: 'bk_' + Date.now() };
    }

    setLoading(false);
    setConfirmedBookingData(result || bookingPayload);
  };

  const handleFinish = () => {
    setConfirmedBookingData(null);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-[#111827] tracking-tight">
              {confirmedBookingData ? 'Booking Confirmation' : `Book ${service.title}`}
            </h3>
            <p className="text-xs text-[#0EA5E0] font-bold mt-0.5">
              {confirmedBookingData ? 'Status: Confirmed' : 'Flat ₹99 Visiting Charge • Doorstep Inspection'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {confirmedBookingData ? (
          /* ========================================================= */
          /* BOOKING CONFIRMED - TECHNICIAN ASSIGNED SUCCESS SCREEN    */
          /* ========================================================= */
          <div className="py-6 space-y-4 animate-scale-up text-left">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide uppercase">
                Booking Confirmed - Technician Assigned
              </span>
              <h4 className="text-xl font-black text-slate-900">
                {confirmedBookingData.serviceTitle || service.title}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Flat ₹99 Visiting Charge confirmed. Your technician has been dispatched and assigned.
              </p>
            </div>

            {/* Assigned Technician Card */}
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={confirmedBookingData.workerAvatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"}
                  alt={confirmedBookingData.workerName || 'Rajesh Sharma'}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-xs"
                />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Expert</p>
                  <p className="text-sm font-black text-slate-900">{confirmedBookingData.workerName || 'Rajesh Sharma'}</p>
                  <p className="text-[11px] text-[#0EA5E0] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0EA5E0]" />
                    <span>JOBit Verified Technician</span>
                  </p>
                </div>
              </div>
              <a
                href={`tel:${confirmedBookingData.workerPhone || '9876543210'}`}
                className="w-9 h-9 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs hover:bg-emerald-50 transition"
                title="Call Technician"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>

            {/* Summary Details */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Scheduled Time:</span>
                <span className="font-bold text-slate-900">{confirmedBookingData.dateTime}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Visiting Charge:</span>
                <span className="font-black text-emerald-600">Flat ₹99 (Paid Online)</span>
              </div>
              <div className="flex justify-between items-start text-slate-600 pt-1 border-t border-slate-200/60">
                <span className="font-medium">Address:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{confirmedBookingData.address}</span>
              </div>
            </div>

            {/* Redirect / Finish Button */}
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-4 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-sm shadow-[0_12px_28px_-6px_rgba(14,165,224,0.45)] active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View in My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* BOOKING FORM - ONLY FLAT ₹99 VISITING FEE                 */
          /* ========================================================= */
          <form onSubmit={handleConfirm} className="space-y-4 pt-4">
            
            {/* Issue / Sub-Category Selector */}
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

            {/* Transparent Customer Pricing Summary - Strictly Flat ₹99 Visiting Charge */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center bg-[#EAF7FD] border border-[#BCE7F8] rounded-xl p-3">
                <div>
                  <span className="text-xs font-black text-slate-900 block">Visiting & Inspection Charge:</span>
                  <span className="text-[10px] text-slate-500 font-medium">Flat fee for doorstep visit by JOBit Verified Technician</span>
                </div>
                <span className="text-base font-black text-[#0EA5E0]">Flat ₹99</span>
              </div>
            </div>

            {/* Trust Guarantee Box */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-[11px] text-emerald-800 font-semibold leading-tight">
                JOBit Guarantee: Verified Technician will inspect on-site. Any additional service labor or replacement parts will be quoted transparently before starting work.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-extrabold text-sm shadow-[0_12px_28px_-6px_rgba(14,165,224,0.45)] active:scale-[0.99] transition cursor-pointer"
            >
              {loading ? 'Confirming...' : 'Confirm Booking • Pay Flat ₹99'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
