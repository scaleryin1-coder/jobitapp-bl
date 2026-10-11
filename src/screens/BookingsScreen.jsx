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
  ShieldCheck
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function BookingsScreen({ onOpenChat, onSelectServiceById }) {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'
  const [bookings, setBookings] = useState([]);
  const [ratingModalBooking, setRatingModalBooking] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    // Read from Firestore if available
    if (isFirebaseConfigured && db) {
      try {
        const q = collection(db, 'bookings');
        const unsub = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          // Filter by current user if logged in, or show all for preview
          const userList = currentUser?.uid 
            ? list.filter(b => b.customerId === currentUser.uid || b.workerId === currentUser.uid)
            : list;
          if (userList.length > 0) {
            setBookings(userList);
          } else {
            readLocalBookings();
          }
        }, () => {
          readLocalBookings();
        });
        return () => unsub();
      } catch (e) {
        readLocalBookings();
      }
    } else {
      readLocalBookings();
    }
  }, [currentUser?.uid]);

  const readLocalBookings = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('jobit_bookings') || '[]');
      if (saved.length === 0) {
        // Seed default initial booking if empty
        const defaultList = [
          {
            id: 'bk_sample_1',
            serviceTitle: 'Plumbing Inspection & Repair',
            categoryName: 'Plumbing',
            workerName: 'Rajesh Sharma',
            workerId: 'worker_rajesh',
            dateTime: 'Tomorrow at 10:00 AM - 12:00 PM',
            address: 'Flat 402, Sunshine Heights, Celina, Delaware',
            price: 300,
            status: 'accepted',
            note: 'Kitchen tap dripping'
          }
        ];
        setBookings(defaultList);
        localStorage.setItem('jobit_bookings', JSON.stringify(defaultList));
      } else {
        setBookings(saved);
      }
    } catch {
      setBookings([]);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
      } catch {
        // Fallback
      }
    }

    const updated = bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
    setBookings(updated);
    localStorage.setItem('jobit_bookings', JSON.stringify(updated));
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
      } catch {
        // Fallback
      }
    }

    setRatingModalBooking(null);
    setReviewComment('');
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'upcoming') {
      return b.status === 'pending' || b.status === 'accepted';
    }
    if (filter === 'completed') {
      return b.status === 'completed';
    }
    if (filter === 'cancelled') {
      return b.status === 'cancelled';
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-white pb-28 text-slate-900 select-none">
      
      {/* Header */}
      <header className="px-5 pt-4 pb-3">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          My Bookings
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Track real-time service appointments and history
        </p>
      </header>

      {/* Tabs: Upcoming / Completed / Cancelled */}
      <div className="px-5 mb-4">
        <div className="flex rounded-full bg-[#F1F3F5] p-1 text-xs font-bold">
          {[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-2.5 rounded-full transition ${
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
      <div className="px-5 space-y-3.5">
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="p-4 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:border-slate-200 transition space-y-3"
          >
            {/* Top Row: Service & Status badge */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5E0]">
                  {booking.categoryName || 'Home Service'}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {booking.serviceTitle}
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                booking.status === 'accepted' ? 'bg-sky-50 text-[#0EA5E0]' :
                booking.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                booking.status === 'cancelled' ? 'bg-red-50 text-red-500' :
                'bg-amber-50 text-amber-600'
              }`}>
                {booking.status.toUpperCase()}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{booking.dateTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{booking.address}</span>
              </div>
            </div>

            {/* Worker & Action Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold">Technician</p>
                <p className="text-xs font-bold text-slate-800">
                  {booking.workerName || 'Rajesh Sharma'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Chat button */}
                <button
                  onClick={() => onOpenChat(booking)}
                  className="w-9 h-9 rounded-full bg-sky-50 text-[#0EA5E0] flex items-center justify-center hover:bg-sky-100 transition"
                  title="Chat with Worker"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>

                {booking.status === 'pending' || booking.status === 'accepted' ? (
                  <>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                      className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      className="px-3 py-1.5 rounded-full bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : booking.status === 'completed' ? (
                  <button
                    onClick={() => setRatingModalBooking(booking)}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-bold shadow-sm"
                  >
                    Rate Pro
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="py-14 text-center bg-slate-50 rounded-[28px] border border-slate-100 p-6">
            <div className="w-12 h-12 rounded-full bg-slate-200/60 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No {filter} bookings</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              You do not have any {filter} appointments at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {ratingModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl relative border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Rate {ratingModalBooking.workerName || 'Worker'}
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
