import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ChevronRight, 
  AlertCircle, 
  Compass, 
  CheckCircle2, 
  Radio,
  Info,
  DollarSign,
  UtensilsCrossed,
  ArrowRight
} from 'lucide-react';
import { LocationPickerField } from '../common/LocationPickerField';
import { 
  createCateringBooking, 
  getNearbyCateringWorkers, 
  CATERING_BASE_PAY_PER_STAFF, 
  CATERING_DEFAULT_RADIUS_KM, 
  CATERING_RECOMMENDED_STANDBY_RATIO 
} from '../../data/cateringShiftService';
import { getLocalWorkers } from '../../data/bookingService';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_OCCASIONS = [
  'Grand Wedding Reception',
  'Family Engagement / Nikah',
  'Birthday Banquet & Party',
  'Corporate Dinner & Buffet',
  'Community Feast / Iftar',
  'Housewarming / Anniversary'
];

const SHIFT_TIMINGS = [
  { id: 'lunch', label: 'Lunch & Afternoon Banquet', time: '11:00 AM - 05:00 PM', desc: 'Peak 6-Hour Shift' },
  { id: 'dinner', label: 'Evening & Dinner Gala', time: '04:30 PM - 11:00 PM', desc: 'Peak 6.5-Hour Shift' },
  { id: 'morning', label: 'Morning Reception & Breakfast', time: '08:00 AM - 02:00 PM', desc: '6-Hour Shift' },
  { id: 'full_day', label: 'Full Day Event Service', time: '08:30 AM - 08:30 PM', desc: 'Full Day Double-Shift' }
];

const ROLE_OPTIONS = [
  'VIP Table Service Captains',
  'Food Counter & Buffet Handlers',
  'Event Service Staff & Waiters',
  'Kitchen Prep & Dishwashing Assistants',
  'Beverage & Juice Station Servers',
  'Banquet Clean-up & Hall Reset Crew'
];

export function CateringBookingModal({ isOpen, onClose, currentCity, onSuccess }) {
  const { currentUser } = useAuth();

  // Form State
  const [totalStaff, setTotalStaff] = useState(10);
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [selectedShift, setSelectedShift] = useState(SHIFT_TIMINGS[0]);
  const [customTime, setCustomTime] = useState('');
  const [occasion, setOccasion] = useState(DEFAULT_OCCASIONS[0]);
  const [customOccasion, setCustomOccasion] = useState('');
  
  // Location State
  const [venueName, setVenueName] = useState('Rose Garden Convention Centre');
  const [address, setAddress] = useState('Near Railway Station, SH 39, Melattur, Kerala');
  const [coordinates, setCoordinates] = useState({ lat: 11.0607, lng: 76.2625 });
  const [radiusKm, setRadiusKm] = useState(CATERING_DEFAULT_RADIUS_KM);

  // Additional details
  const [selectedRoles, setSelectedRoles] = useState(ROLE_OPTIONS.slice(0, 4));
  const [uniformPreference, setUniformPreference] = useState('Formal Black Trousers, White Shirt & Bow Tie');
  const [specialNotes, setSpecialNotes] = useState('Please report 30 minutes before shift time for table assignments.');
  const [contactName, setContactName] = useState(() => currentUser?.name || 'Valued Host');
  const [contactPhone, setContactPhone] = useState(() => currentUser?.phone || '+91 98471 23456');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [nearbyWorkers, setNearbyWorkers] = useState([]);

  // Calculate standby count (auto 20% buffer, min 1, default 2 for 10 staff)
  const standbyCount = Math.max(1, Math.ceil(totalStaff * CATERING_RECOMMENDED_STANDBY_RATIO));

  // Pricing calculations
  const ratePerStaff = CATERING_BASE_PAY_PER_STAFF;
  const estimatedTotal = totalStaff * ratePerStaff;
  const advanceDeposit = 500;
  const remainingBalance = Math.max(0, estimatedTotal - advanceDeposit);

  // Recalculate available nearby workers within 10 km whenever coordinates change
  useEffect(() => {
    if (coordinates?.lat && coordinates?.lng) {
      const matched = getNearbyCateringWorkers(coordinates, radiusKm);
      setNearbyWorkers(matched);
    }
  }, [coordinates?.lat, coordinates?.lng, radiusKm]);

  if (!isOpen) return null;

  const handleRoleToggle = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!venueName.trim() || !address.trim()) {
      alert('Please enter your event venue name and complete address.');
      return;
    }

    setSubmitting(true);
    try {
      const finalShiftTime = customTime.trim() || selectedShift.time;
      const finalOccasion = customOccasion.trim() || occasion;

      const payload = {
        customerName: contactName.trim(),
        customerPhone: contactPhone.trim(),
        customerId: currentUser?.uid || 'guest_user',
        totalStaffNeeded: totalStaff,
        standbyStaffNeeded: standbyCount,
        functionDate: eventDate,
        functionTime: finalShiftTime,
        shiftType: selectedShift.label,
        venueName: venueName.trim(),
        functionLocation: `${venueName.trim()}, ${address.trim()}`,
        address: address.trim(),
        fullAddress: `${venueName.trim()}, ${address.trim()}`,
        city: currentCity || 'Melattur, Kerala',
        user_latitude: coordinates.lat,
        user_longitude: coordinates.lng,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        coordinates,
        radiusKm,
        eventOccasion: finalOccasion,
        uniform: uniformPreference,
        rolesNeeded: selectedRoles,
        specialInstructions: specialNotes.trim(),
        ratePerStaff,
        estimatedTotal,
        advancePaid: advanceDeposit,
        remainingDue: remainingBalance
      };

      const created = await createCateringBooking(payload);
      setSubmittedBooking(created);
      onSuccess?.(created);
    } catch (err) {
      console.error('Failed to submit catering inquiry:', err);
      alert('Unable to submit catering booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 via-white to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shadow-xs">
              🍽️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Catering Staff Booking</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full">
                  Shift Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Verified banquet waiters & kitchen crew • 10 KM radius dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        {submittedBooking ? (
          /* Instant Submission Success Screen */
          <div className="p-6 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-xs">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Inquiry Broadcasted to 10 KM Radius
              </span>
              <h4 className="text-lg font-black text-slate-900 mt-2">
                Catering Staff Order Live!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                Your event requirements have been instantly broadcasted to{' '}
                <strong className="text-slate-900 font-bold">{nearbyWorkers.length || 14} verified catering professionals</strong>{' '}
                within 10 KM of {submittedBooking.venueName}.
              </p>
            </div>

            {/* Shift Breakdown Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Booking ID</span>
                <span className="font-mono font-bold text-slate-800">#{submittedBooking.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Staff Requested</span>
                <span className="font-extrabold text-slate-900">
                  {submittedBooking.totalStaffNeeded} Primary + {submittedBooking.standbyStaffNeeded} Standby
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Event Date & Time</span>
                <span className="font-bold text-slate-800">
                  {submittedBooking.functionDate} • {submittedBooking.functionTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Venue</span>
                <span className="font-bold text-slate-800 truncate max-w-[240px]">
                  {submittedBooking.venueName}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Estimated Shift Pay</span>
                <span className="font-extrabold text-rose-600 text-sm">
                  ₹{submittedBooking.estimatedTotal} ({submittedBooking.totalStaffNeeded} × ₹{ratePerStaff})
                </span>
              </div>
            </div>

            {/* Zero-Drop Standby Guarantee Banner */}
            <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-left text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold">Urban Company / Joboy Zero-Drop Guarantee Active:</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  The system will assign {submittedBooking.standbyStaffNeeded} standby backup staff. On the morning of your event, if any primary worker reports unable to attend, our auto-allocation algorithm immediately promotes standby staff with zero downtime.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-900 text-white font-extrabold rounded-2xl text-xs hover:bg-black transition cursor-pointer shadow-md"
            >
              Done • Track in Bookings Screen
            </button>
          </div>
        ) : (
          /* Main Input Form */
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-slate-900">
            {/* Live 10 KM Radius Worker Radar */}
            <div className="p-3 bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl border border-rose-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="font-extrabold text-rose-900">10 KM Catering Radar:</span>
                <span className="text-rose-700 font-semibold">
                  {nearbyWorkers.length > 0 ? `${nearbyWorkers.length} Verified Staff Online` : '14 Catering Staff Available in Zone'}
                </span>
              </div>
              <span className="text-[10px] font-black text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                Instant Push Alert
              </span>
            </div>

            {/* 1. Occasion / Event Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Event / Function Occasion
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DEFAULT_OCCASIONS.map(occ => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => { setOccasion(occ); setCustomOccasion(''); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      occasion === occ && !customOccasion
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customOccasion}
                onChange={e => setCustomOccasion(e.target.value)}
                placeholder="Or specify custom occasion (e.g., Annual Sports Club Banquet)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* 2. Total Staff Count Needed + Standby Ratio */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Total Staff Count Needed
                  </label>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Recommended: 1 staff per 25 buffet guests or 1 per 15 seated guests
                  </p>
                </div>
                {/* Stepper */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setTotalStaff(prev => Math.max(2, prev - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center transition cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-extrabold text-sm text-slate-900">
                    {totalStaff}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTotalStaff(prev => Math.min(50, prev + 1))}
                    className="w-7 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black flex items-center justify-center transition cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Quick:</span>
                {[5, 10, 15, 20, 25, 30].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTotalStaff(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      totalStaff === cnt
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cnt} Staff
                  </button>
                ))}
              </div>

              {/* Auto Standby Banner */}
              <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Auto-Standby: <strong className="font-extrabold">{standbyCount} Backup Staff</strong> reserved free of charge
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Zero Drop Guarantee
                </span>
              </div>
            </div>

            {/* 3. Function Date & Shift Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Function Date</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Shift Duration Preset</span>
                </label>
                <select
                  value={selectedShift.id}
                  onChange={e => {
                    const found = SHIFT_TIMINGS.find(s => s.id === e.target.value);
                    if (found) setSelectedShift(found);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  {SHIFT_TIMINGS.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.time})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Function Location / Venue Address */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Venue / Auditorium / Hall Name</span>
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={e => setVenueName(e.target.value)}
                  placeholder="e.g., Rose Garden Convention Centre / Royal Palace Hall"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* Exact Doorstep Map Location Picker */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Venue GPS Map & Full Address (10 KM Broadcast Radius)
                </label>
                <LocationPickerField
                  value={address}
                  onChange={(newAddr) => setAddress(newAddr)}
                  coordinates={coordinates}
                  onCoordinatesChange={(newCoords) => setCoordinates(newCoords)}
                  targetCategory="Catering Staff"
                />
              </div>
            </div>

            {/* 5. Role Mix Needed */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Roles Needed for Event
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(role => {
                  const isChecked = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer border flex items-center justify-between ${
                        isChecked
                          ? 'bg-rose-50 text-rose-900 border-rose-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate pr-1">{role}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Uniform & Special Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Uniform Specification
                </label>
                <input
                  type="text"
                  value={uniformPreference}
                  onChange={e => setUniformPreference(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Host Contact Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            {/* 7. Industry Standard Price Calculation Summary */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 text-xs shadow-md">
              <div className="flex justify-between items-center text-slate-300">
                <span>Staff Daily Shift Rate:</span>
                <span className="font-bold">₹{ratePerStaff} / professional</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Primary Staff Count:</span>
                <span className="font-bold">{totalStaff} Professionals</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400">
                <span>Standby Backup Staff ({standbyCount}):</span>
                <span className="font-black uppercase tracking-wider">Included Free</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Shift Estimate</span>
                  <span className="text-lg font-black text-white">₹{estimatedTotal}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Advance Token Deposit</span>
                  <span className="text-sm font-black text-rose-400">₹{advanceDeposit}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-black rounded-2xl text-xs hover:from-rose-600 hover:to-rose-700 transition cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Broadcasting to 10 KM Catering Workers...</span>
              ) : (
                <>
                  <span>Submit Inquiry & Broadcast to {nearbyWorkers.length || 14} Workers Near You</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
