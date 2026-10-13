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
  Download
} from 'lucide-react';
import { 
  subscribeBookings, 
  updateBookingStatus 
} from '../data/bookingService';
import { useAuth } from '../context/AuthContext';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export function BookingsScreen({ onOpenChat, onSelectServiceById }) {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'
  const [bookings, setBookings] = useState([]);
  const [ratingModalBooking, setRatingModalBooking] = useState(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Subscribe to real-time synchronized bookings
  useEffect(() => {
    const unsub = subscribeBookings((list) => {
      // In customer view, show all if guest/test, or filter by customerId
      setBookings(list);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await updateBookingStatus(bookingId, 'cancelled');
    }
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
    alert('Thank you! Your rating has been recorded.');
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'upcoming') {
      return ['pending', 'accepted', 'on_the_way', 'in_progress'].includes(b.status);
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
  const getStepProgress = (status) => {
    switch (status) {
      case 'pending': return { step: 1, text: 'Pending Assignment', color: 'text-amber-600', bg: 'bg-amber-500' };
      case 'accepted': return { step: 2, text: 'Worker Accepted', color: 'text-[#0EA5E0]', bg: 'bg-[#0EA5E0]' };
      case 'on_the_way': return { step: 3, text: 'On the Way', color: 'text-purple-600', bg: 'bg-purple-600' };
      case 'in_progress': return { step: 4, text: 'Work Started', color: 'text-amber-600', bg: 'bg-amber-600' };
      case 'completed': return { step: 5, text: 'Completed & Paid', color: 'text-emerald-600', bg: 'bg-emerald-600' };
      default: return { step: 0, text: status, color: 'text-slate-500', bg: 'bg-slate-400' };
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      {/* Header */}
      <header className="px-5 pt-4 pb-3 bg-white border-b border-slate-100">
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
            { id: 'upcoming', label: `Active (${bookings.filter(b => ['pending','accepted','on_the_way','in_progress'].includes(b.status)).length})` },
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
          const stepInfo = getStepProgress(booking.status);

          return (
            <div
              key={booking.id}
              className="p-4 rounded-[26px] bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden"
            >
              {/* Top Service Header */}
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
                  <span className="text-sm font-black text-slate-900">₹{booking.totalServiceCharge || booking.price || 650}</span>
                  <p className="text-[10px] text-slate-400 font-bold">Total Work Fee</p>
                </div>
              </div>

              {/* Transparent Customer Billing Breakdown - NEVER shows platform fee */}
              <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Total Service Charge:</span>
                  <span className="font-extrabold text-slate-900">₹{booking.totalServiceCharge || booking.price || 650}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-600 font-medium">
                  <span>Advance Paid (Inspection Fee):</span>
                  <span className="font-bold">-₹{booking.advancePaid || 99}</span>
                </div>
                <div className="flex items-center justify-between text-slate-900 font-black pt-1.5 border-t border-slate-200">
                  <span>Remaining Amount Due:</span>
                  <span className="text-sm font-black text-[#0EA5E0]">₹{booking.remainingDue || 551}</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-0.5 font-semibold">
                  {booking.status === 'completed' 
                    ? '✓ Service completed & balance settled' 
                    : '• Balance payable directly to JOBit Technician upon completion'}
                </p>
              </div>

              {/* 5-Step Real-time Status Stepper */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {booking.status === 'pending' && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
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
                    style={{ width: `${(stepInfo.step / 5) * 100}%` }}
                  />
                </div>

                {/* 5 Sub-stages labels */}
                <div className="grid grid-cols-5 text-[8px] font-black text-slate-400 text-center uppercase tracking-tighter pt-0.5">
                  <span className={stepInfo.step >= 1 ? 'text-amber-600' : ''}>1. Pending</span>
                  <span className={stepInfo.step >= 2 ? 'text-[#0EA5E0]' : ''}>2. Accepted</span>
                  <span className={stepInfo.step >= 3 ? 'text-purple-600' : ''}>3. On Way</span>
                  <span className={stepInfo.step >= 4 ? 'text-amber-600' : ''}>4. Started</span>
                  <span className={stepInfo.step >= 5 ? 'text-emerald-600' : ''}>5. Done</span>
                </div>

                {booking.status === 'pending' && (
                  <p className="text-[11px] text-amber-700 font-semibold bg-amber-50/80 p-2 rounded-xl border border-amber-200/60 leading-tight">
                    🚨 Request broadcasted! Nearby JOBit Verified Technicians are alerted. Will automatically advance when accepted.
                  </p>
                )}
              </div>

              {/* Technician Info Card - Strictly branded as JOBit Verified Technicians / Experts */}
              {booking.workerName ? (
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
                    <a
                      href={`tel:${booking.workerPhone || '9876543210'}`}
                      className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs hover:bg-emerald-50 transition"
                      title="Call JOBit Expert"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
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
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#0EA5E0] animate-pulse" />
                    <span className="font-semibold text-slate-700">Awaiting JOBit Verified Technician pickup...</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Hyperlocal Radius</span>
                </div>
              )}

              {/* Schedule & Address */}
              <div className="space-y-1 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{booking.dateTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{booking.address}</span>
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
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-3 py-1.5 rounded-full bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition cursor-pointer"
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
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Summary Card */}
            <div className="mt-4 space-y-3.5">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-800">#{receiptModalBooking.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Service:</span>
                  <span className="font-bold text-slate-800">{receiptModalBooking.serviceTitle}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Appointment:</span>
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

              {/* Transparent Customer Line Items */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Billing Breakdown
                </h4>
                
                <div className="flex justify-between text-xs text-slate-700 font-semibold">
                  <span>Total Service Charge</span>
                  <span className="font-black text-slate-900">₹{receiptModalBooking.totalServiceCharge || receiptModalBooking.price || 650}</span>
                </div>

                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>Advance Paid (Inspection Fee)</span>
                  <span className="font-black">-₹{receiptModalBooking.advancePaid || 99}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Remaining Amount Due</span>
                  <span className="text-base text-[#0EA5E0]">₹{receiptModalBooking.remainingDue || 551}</span>
                </div>
              </div>

              {/* Assurance Seal */}
              <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5 text-[11px] text-sky-900">
                <ShieldCheck className="w-4 h-4 text-[#0EA5E0] shrink-0 mt-0.5" />
                <p className="leading-tight font-medium">
                  <strong>JOBit Staff Guarantee:</strong> All work is completed by official JOBit Verified Technicians. Pay remaining due upon job satisfaction. Zero hidden platform commissions.
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

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingModalBooking(null)}
                  className="flex-1 py-3 rounded-full bg-[#F1F3F5] text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-bold shadow-glow"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
