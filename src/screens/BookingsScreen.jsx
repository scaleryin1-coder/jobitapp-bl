import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageCircle, 
  Star, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Phone,
  User,
  Radio,
  Navigation,
  Receipt,
  FileText,
  X,
  Sparkles,
  Download,
  QrCode
} from 'lucide-react';
import { 
  subscribeBookings, 
  updateBookingStatus 
} from '../data/bookingService';
import { useAuth } from '../context/AuthContext';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { VoiceCallModal } from '../components/voice/VoiceCallModal';
import { PaymentQRModal } from '../components/billing/PaymentQRModal';

export function BookingsScreen({ onOpenChat, onSelectServiceById }) {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'
  const [bookings, setBookings] = useState([]);
  const [ratingModalBooking, setRatingModalBooking] = useState(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState(null);
  const [paymentQRBooking, setPaymentQRBooking] = useState(null);
  const [activeVoiceCallBooking, setActiveVoiceCallBooking] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Subscribe to real-time synchronized bookings
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setBookings([]);
      return;
    }
    const unsub = subscribeBookings((list) => {
      setBookings(list || []);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleCancelBooking = async (bookingId) => {
    await updateBookingStatus(bookingId, 'cancelled');
    showNotification('Booking cancelled.');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!ratingModalBooking) return;

    const reviewData = {
      serviceId: ratingModalBooking.serviceId || 'serv_plumbing_1',
      customerId: currentUser?.uid || 'guest_user',
      customerName: currentUser?.name || 'Customer',
      rating: ratingValue,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'reviews'), reviewData);
      } catch {}
    }

    setRatingModalBooking(null);
    setReviewComment('');
    showNotification('Thank you! Your rating has been recorded.');
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'upcoming') {
      return ['confirmed', 'pending', 'assigned', 'accepted', 'on_the_way', 'in_progress'].includes(b.status);
    }
    if (filter === 'completed') {
      return b.status === 'completed';
    }
    if (filter === 'cancelled') {
      return b.status === 'cancelled';
    }
    return true;
  });

  // Helper to map status to step 1..5
  const getStepProgress = (booking) => {
    const status = typeof booking === 'string' ? booking : (booking?.status || 'pending');
    const isAccepted = typeof booking === 'object' && Boolean(
      booking?.acceptedAt || 
      booking?.assignedAt ||
      booking?.workerAccepted === true || 
      ['assigned', 'accepted', 'on_the_way', 'in_progress', 'completed'].includes(status)
    );

    switch (status) {
      case 'pending':
      case 'confirmed': 
        if (!isAccepted) {
          return { step: 1, text: 'Booking Confirmed • Finding Nearby Technician', color: 'text-sky-600', bg: 'bg-[#0EA5E0]' };
        }
        return { step: 2, text: 'Technician Assigned', color: 'text-[#0EA5E0]', bg: 'bg-[#0EA5E0]' };
      case 'assigned':
      case 'accepted': 
        return { step: 2, text: 'Technician Assigned', color: 'text-[#0EA5E0]', bg: 'bg-[#0EA5E0]' };
      case 'on_the_way': 
        return { step: 3, text: 'Technician On the Way', color: 'text-purple-600', bg: 'bg-purple-600' };
      case 'in_progress': 
        return { step: 4, text: 'Inspection & Work Started', color: 'text-amber-600', bg: 'bg-amber-600' };
      case 'completed': 
        return { step: 5, text: 'Service Completed', color: 'text-emerald-600', bg: 'bg-emerald-600' };
      case 'cancelled': 
        return { step: 0, text: 'Cancelled', color: 'text-red-500', bg: 'bg-red-400' };
      default: 
        return { step: 1, text: 'Booking Confirmed • Finding Nearby Technician', color: 'text-sky-600', bg: 'bg-[#0EA5E0]' };
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      <header 
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
        className="px-5 pb-3 bg-white border-b border-slate-100"
      >
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          My Bookings & Trackings
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Live dispatch tracking and service status updates
        </p>
      </header>

      {/* Tabs: Active Upcoming / Completed / Cancelled */}
      <div className="px-5 py-3">
        <div className="flex rounded-full bg-[#E9ECEF] p-1 text-xs font-bold">
          {[
            { id: 'upcoming', label: `Active (${bookings.filter(b => ['confirmed', 'pending', 'accepted', 'on_the_way', 'in_progress'].includes(b.status)).length})` },
            { id: 'completed', label: `Completed (${bookings.filter(b => b.status === 'completed').length})` },
            { id: 'cancelled', label: `Cancelled (${bookings.filter(b => b.status === 'cancelled').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-2.5 rounded-full transition cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-5 space-y-4">
        {filteredBookings.map((booking) => {
          const stepInfo = getStepProgress(booking);
          const hasWorkerAccepted = Boolean(
            booking.workerName && 
            (booking.status === 'accepted' || 
             booking.status === 'on_the_way' || 
             booking.status === 'in_progress' || 
             booking.status === 'completed' || 
             booking.workerAccepted === true)
          );

          return (
            <div
              key={booking.id}
              className="p-4 rounded-[26px] bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden"
            >
              {/* Top Service Header */}
              {booking.bookingType === 'CATERING_BULK' ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        {booking.eventOccasion || 'Catering Staff'}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1 leading-tight">
                        {booking.venueName || booking.serviceTitle}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-600">₹{booking.estimatedTotal}</span>
                      <p className="text-[10px] text-slate-400 font-bold">Advance ₹{booking.advancePaid || 500} Paid</p>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-800 font-bold">
                      <span>Staff Allocation:</span>
                      <span className="font-extrabold text-rose-600">
                        {booking.totalStaffNeeded} Primary + {booking.standbyStaffNeeded} Standby
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>Event Date & Shift:</span>
                      <span className="font-bold text-slate-800">{booking.functionDate} • {booking.functionTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>Staff Attendance:</span>
                      <span className="font-extrabold text-emerald-700">
                        {(booking.primaryWorkers || []).filter(w => ['attendance_confirmed', 'on_my_way'].includes(w.shiftStatus)).length}/{booking.totalStaffNeeded} Confirmed Present
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-rose-100 flex items-center justify-between text-[11px] text-slate-700">
                      <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Zero-Drop Guarantee: {booking.standbyStaffNeeded} Standby Ready</span>
                      </span>
                      <span className="text-slate-400">10 KM Zone</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0EA5E0] bg-sky-50 px-2.5 py-0.5 rounded-full">
                        {booking.categoryName || 'Home Service'}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1 leading-tight">
                        {booking.serviceTitle}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#0EA5E0]">Flat ₹99</span>
                      <p className="text-[10px] text-slate-400 font-bold">Visiting Fee Paid</p>
                    </div>
                  </div>

                  {/* Clean Customer Booking Summary - Strictly Flat ₹99 Visiting Fee Only */}
                  <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span>Visiting & Inspection Fee:</span>
                      <span className="font-black text-emerald-600">Flat ₹99 (Paid Online)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                      • Covers technician doorstep visit and inspection. Additional service labor or spare parts (if any) will be quoted on-site after diagnosis.
                    </p>
                  </div>
                </>
              )}

              {/* 5-Step Real-time Status Stepper */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                    <p className={`text-xs font-black ${stepInfo.color}`}>
                      {stepInfo.text}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400">
                    Step {stepInfo.step} of 5
                  </span>
                </div>

                {/* Stepper visual bar */}
                <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full ${stepInfo.bg} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.max(20, (stepInfo.step / 5) * 100)}%` }}
                  />
                </div>

                {/* 5 Sub-stages labels */}
                <div className="grid grid-cols-5 text-[8px] font-black text-slate-400 text-center uppercase tracking-tighter pt-0.5">
                  <span className={stepInfo.step >= 1 ? 'text-emerald-600 font-black' : ''}>1. Confirmed</span>
                  <span className={stepInfo.step >= 2 ? 'text-[#0EA5E0] font-black' : ''}>2. Assigned</span>
                  <span className={stepInfo.step >= 3 ? 'text-purple-600 font-black' : ''}>3. On Way</span>
                  <span className={stepInfo.step >= 4 ? 'text-amber-600 font-black' : ''}>4. Inspected</span>
                  <span className={stepInfo.step >= 5 ? 'text-emerald-600 font-black' : ''}>5. Done</span>
                </div>

                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60 leading-tight flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {hasWorkerAccepted
                        ? 'Booking Confirmed! JOBit Verified Technician assigned for your visit.'
                        : 'Booking Confirmed! Searching nearby verified technicians in your area.'}
                    </span>
                  </p>
                )}
              </div>

              {/* Technician Info Card - ONLY displayed after technician actually accepts the job */}
              {hasWorkerAccepted ? (
                <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={booking.workerAvatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"}
                      alt={booking.workerName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white"
                    />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">JOBit Verified Technician</p>
                      <p className="text-xs font-black text-slate-900">{booking.workerName}</p>
                      <p className="text-[10px] text-sky-600 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#0EA5E0]" />
                        <span>JOBit Expert</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveVoiceCallBooking(booking)}
                      className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs hover:bg-emerald-50 transition cursor-pointer"
                      title="In-App Voice Call (Agora.io - Phone number protected)"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenChat(booking)}
                      className="w-8 h-8 rounded-full bg-white text-[#0EA5E0] flex items-center justify-center shadow-xs hover:bg-sky-50 transition cursor-pointer"
                      title="Chat with JOBit Expert"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0EA5E0]"></span>
                    </span>
                    <div>
                      <p className="font-extrabold text-slate-800">Finding Verified Technician Nearby...</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Broadcasting request. Name, call & message options will appear once accepted.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-[#0EA5E0] bg-white px-2.5 py-1 rounded-full border border-sky-100 shadow-2xs">
                    Searching
                  </span>
                </div>
              )}

              {/* Schedule & Address */}
              <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{booking.dateTime}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-800 break-words whitespace-normal leading-relaxed">{booking.address}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    #{booking.id.slice(-6)}
                  </span>
                  <button
                    onClick={() => setReceiptModalBooking(booking)}
                    className="px-2.5 py-1 rounded-full bg-sky-50 hover:bg-sky-100 text-[#0EA5E0] text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>View Receipt</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {(booking.status === 'in_progress' || booking.status === 'completed') && (
                    <button
                      onClick={() => setPaymentQRBooking(booking)}
                      className="px-2.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black transition cursor-pointer flex items-center gap-1 border border-emerald-200"
                      title="View Bill & Payment QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{booking.status === 'completed' ? 'Bill & QR' : 'Pay via QR'}</span>
                    </button>
                  )}

                  {['confirmed', 'pending'].includes(booking.status) && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {booking.status === 'completed' && (
                    <button
                      onClick={() => setRatingModalBooking(booking)}
                      className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-bold shadow-xs hover:opacity-95 transition cursor-pointer"
                    >
                      Rate JOBit Expert ★
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredBookings.length === 0 && (
          <div className="py-14 text-center bg-white rounded-3xl border border-slate-100 p-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No {filter} bookings</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              You do not have any {filter} appointments right now.
            </p>
          </div>
        )}
      </div>

      {/* Customer Receipt Modal - Official Transparent Customer Billing */}
      {receiptModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Official Service Receipt
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    JOBit Verified Staff Billing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceiptModalBooking(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="py-4 space-y-4">
              <div className="bg-[#F8FAFC] rounded-2xl p-4 space-y-2 text-xs border border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>Booking Reference:</span>
                  <span className="font-extrabold text-slate-800">#{receiptModalBooking.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Service Requested:</span>
                  <span className="font-extrabold text-slate-800">{receiptModalBooking.serviceTitle}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Appointment Slot:</span>
                  <span className="font-medium text-slate-700">{receiptModalBooking.dateTime}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Assigned Pro:</span>
                  <span className="font-black text-[#0EA5E0]">
                    {receiptModalBooking.workerName ? `${receiptModalBooking.workerName} (JOBit Expert)` : 'JOBit Verified Technician'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Service Address:</span>
                  <span className="font-medium text-slate-700 text-right truncate max-w-[200px]">{receiptModalBooking.address}</span>
                </div>
              </div>

              {/* Customer Billing Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Customer Billing Breakdown
                </h4>
                
                {receiptModalBooking.status === 'completed' || receiptModalBooking.serviceCharge ? (
                  <>
                    <div className="flex justify-between text-xs text-slate-700 font-semibold">
                      <span>Service Charge (Labor)</span>
                      <span className="font-black text-slate-900">₹{receiptModalBooking.serviceCharge || 300}</span>
                    </div>

                    {Number(receiptModalBooking.sparePrice) > 0 && (
                      <div className="flex justify-between text-xs text-slate-700 font-semibold">
                        <span>Spare Price</span>
                        <span className="font-black text-slate-900">₹{receiptModalBooking.sparePrice}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-slate-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <span>Customer Platform Fee (5%)</span>
                        <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-1.5 py-0.2 rounded">5%</span>
                      </span>
                      <span className="font-black text-[#0EA5E0]">
                        ₹{receiptModalBooking.customerPlatformFee !== undefined 
                            ? receiptModalBooking.customerPlatformFee 
                            : Math.round((Number(receiptModalBooking.serviceCharge || 300) * 0.05) * 100) / 100}
                      </span>
                    </div>

                    <div className="pt-2 border-t-2 border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                      <span>Total Amount Paid</span>
                      <span className="text-base text-emerald-600">
                        ₹{receiptModalBooking.totalCustomerPayable || receiptModalBooking.totalPayable || (
                          Number(receiptModalBooking.serviceCharge || 300) + 
                          Number(receiptModalBooking.sparePrice || 0) + 
                          Math.round((Number(receiptModalBooking.serviceCharge || 300) * 0.05) * 100) / 100
                        )} (Paid)
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                      Payment Mode: {receiptModalBooking.paymentMethod || 'Paid by Cash / QR'} • Settled & Verified
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-xs text-slate-700 font-semibold">
                      <span>Visiting & Inspection Fee</span>
                      <span className="font-black text-slate-900">₹99</span>
                    </div>

                    <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                      <span>Amount Paid Online</span>
                      <span className="font-black text-emerald-600">₹99 (Paid)</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                      <span>Remaining Visiting Balance</span>
                      <span className="text-base text-emerald-600">₹0 (Settled)</span>
                    </div>
                  </>
                )}
              </div>

              {/* Assurance Seal */}
              <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5 text-[11px] text-sky-900">
                <ShieldCheck className="w-4 h-4 text-[#0EA5E0] shrink-0 mt-0.5" />
                <p className="leading-tight font-medium">
                  <strong>JOBit Staff Guarantee:</strong> All doorstep visits are conducted by official JOBit Verified Technicians. Zero hidden platform commissions.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    setReceiptModalBooking(null);
                  }}
                  className="flex-1 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition cursor-pointer shadow-sm text-center"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {ratingModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Rate {ratingModalBooking.workerName || 'JOBit Expert'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{ratingModalBooking.serviceTitle}</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setRatingValue(s)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star className={`w-7 h-7 ${s <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>

              <textarea
                rows="3"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
                placeholder="Share your experience (punctuality, clean work, etc.)..."
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingModalBooking(null)}
                  className="flex-1 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#0EA5E0] text-white text-xs font-bold shadow-xs hover:bg-[#0284C7] transition"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Payment QR Modal */}
      <PaymentQRModal
        isOpen={Boolean(paymentQRBooking)}
        onClose={() => setPaymentQRBooking(null)}
        booking={paymentQRBooking}
        userRole="customer"
        onConfirmPayment={async (details) => {
          await updateBookingStatus(paymentQRBooking.id, 'completed', {
            ...details,
            completedAt: new Date().toISOString(),
            paymentStatus: 'paid'
          });
          setPaymentQRBooking(null);
          showNotification('Payment confirmed! Job completed successfully.');
        }}
      />

      {/* Agora.io Voice Call Modal */}
      <VoiceCallModal
        isOpen={Boolean(activeVoiceCallBooking)}
        onClose={() => setActiveVoiceCallBooking(null)}
        booking={activeVoiceCallBooking}
        currentUserRole="customer"
      />

      {/* In-app Toast Banner */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-slate-700/60 animate-fade-in flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#0EA5E0]" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}
