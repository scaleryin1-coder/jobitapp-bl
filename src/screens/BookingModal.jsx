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
  ArrowRight,
  AlertCircle,
  Compass,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { createBooking, getWorkersForCategoryInLocation, maskPhoneNumber, checkServiceAvailabilityByRadius } from '../data/bookingService';
import { useAuth } from '../context/AuthContext';
import { getSubCategoriesForCategory, isPortfolioCategory } from '../data/categoriesData';
import { VoiceCallModal } from '../components/voice/VoiceCallModal';
import { LocationPickerField } from '../components/common/LocationPickerField';

// Baseline coordinates lookup for key service hubs
const DEFAULT_CITY_COORDS = {
  'melattur': { lat: 11.0607, lng: 76.2625 },
  'pattikkad': { lat: 11.0267, lng: 76.2081 },
  'pandikkad': { lat: 11.1118, lng: 76.2415 },
  'perinthalmanna': { lat: 10.9760, lng: 76.2254 },
  'manjeri': { lat: 11.1213, lng: 76.1213 },
  'malappuram': { lat: 11.0732, lng: 76.0740 },
  'kozhikode': { lat: 11.2588, lng: 75.7804 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 }
};

const getInitialCoords = (locName) => {
  const key = (locName || '').toLowerCase();
  for (const [cityKey, coords] of Object.entries(DEFAULT_CITY_COORDS)) {
    if (key.includes(cityKey)) return { ...coords };
  }
  return { lat: 11.0607, lng: 76.2625 }; // Melattur default
};

// Helper to determine if a time slot has already passed based on current date & time
export const isTimeSlotPassed = (slotString, selectedDateString) => {
  if (!selectedDateString) return false;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localToday = `${year}-${month}-${day}`;

  // If selected date is in the past, all slots are passed
  if (selectedDateString < localToday) {
    return true;
  }

  // If selected date is a future date, slot is active and selectable
  if (selectedDateString > localToday) {
    return false;
  }

  // If selected date is TODAY: check slot start time against now
  try {
    const startPart = slotString.split('-')[0].trim();
    const match = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;

    let [_, hoursStr, minutesStr, modifier] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (modifier.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    const slotStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    return now >= slotStartTime;
  } catch {
    return false;
  }
};

export function BookingModal({ service, isOpen, onClose, onSuccess, currentCity, workers = [], onRequireAuth }) {
  const { currentUser } = useAuth() || {};
  const effectiveCity = currentCity || localStorage.getItem('jobit_user_location') || currentUser?.city || 'Melattur, Kerala';
  const cleanCity = effectiveCity.split(',')[0].trim();
  
  // Detailed Address fields
  const [houseName, setHouseName] = useState('');
  const [address, setAddress] = useState('');
  const [plusCode, setPlusCode] = useState('');

  // Exact Map Pin Coordinates (Latitude & Longitude)
  const [coordinates, setCoordinates] = useState(() => getInitialCoords(effectiveCity));

  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);

  // Validation state tracking
  const [touched, setTouched] = useState({
    address: false,
    date: false,
    timeSlot: false
  });

  const isAddressValid = Boolean(address && address.trim().length > 2);
  const isCoordinatesValid = Boolean(
    coordinates &&
    coordinates.lat !== undefined &&
    coordinates.lng !== undefined &&
    !isNaN(Number(coordinates.lat)) &&
    !isNaN(Number(coordinates.lng)) &&
    Number(coordinates.lat) !== 0
  );

  // Dynamic Radius Availability Check (Swiggy / Zomato style)
  const radiusAvailability = React.useMemo(() => {
    if (!service || !coordinates?.lat || !coordinates?.lng) {
      return { isAvailable: true, matchingCount: 0, minDistanceKm: null };
    }
    return checkServiceAvailabilityByRadius({
      category: service.categoryName || service.title,
      service,
      coordinates,
      workersList: workers
    });
  }, [service, coordinates?.lat, coordinates?.lng, workers]);

  const isLocationAvailable = Boolean(radiusAvailability?.isAvailable);
  const isDateValid = Boolean(date && date.trim().length > 0);
  const isTimeSlotValid = Boolean(timeSlot && timeSlot.trim().length > 0 && !isTimeSlotPassed(timeSlot, date));
  const isFormValid = isAddressValid && isCoordinatesValid && isDateValid && isTimeSlotValid && isLocationAvailable;
  
  const now = new Date();
  const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Automatically deselect time slot if user changes date and the slot has already passed
  useEffect(() => {
    if (date && timeSlot && isTimeSlotPassed(timeSlot, date)) {
      setTimeSlot('');
    }
  }, [date, timeSlot]);

  // Derive sub-categories for this service/category
  const availableSubCategories = service
    ? (service.subCategories && service.subCategories.length > 0
        ? service.subCategories
        : getSubCategoriesForCategory(service.categoryName || service.title))
    : [];

  const [selectedSubCategory, setSelectedSubCategory] = useState(
    availableSubCategories[0] || 'Standard Inspection & Service'
  );

  // Check if this booking is for a portfolio category with an explicitly chosen pro
  const isPortfolioTrade = Boolean(service && isPortfolioCategory(service));
  const hasPreselectedWorker = isPortfolioTrade && Boolean(service?.workerId);

  // Check if at least one Admin-approved worker is available in this area
  const availableWorkers = getWorkersForCategoryInLocation(service, effectiveCity, workers);
  const isAvailable = availableWorkers.length > 0;

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
      setHouseName('');
      setAddress('');
      setPlusCode('');
      setCoordinates(getInitialCoords(effectiveCity));
      setDate('');
      setTimeSlot('');
      setNote('');
      setTouched({ address: false, date: false, timeSlot: false });
    }
  }, [isOpen, effectiveCity]);

  // Helper to compose full address string
  const getFullAddress = () => {
    if (address && address.trim().length > 0) {
      if (houseName && houseName.trim()) {
        return `${houseName.trim()}, ${address.trim()}`;
      }
      return address.trim();
    }
    return cleanCity;
  };

  if (!isOpen || !service) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.uid || currentUser.uid === 'guest_user' || !currentUser.phone) {
      onRequireAuth?.();
      return;
    }
    if (!isFormValid) {
      setTouched({ address: true, date: true, timeSlot: true });
      return;
    }
    if (loading) return;
    setLoading(true);

    const finalAddress = getFullAddress();

    // Strictly enforce requirement: In non-portfolio trades, NEVER assign worker prematurely
    const workerId = hasPreselectedWorker ? service.workerId : null;
    const workerName = hasPreselectedWorker ? service.workerName : null;
    const workerPhone = hasPreselectedWorker ? service.workerPhone : null;
    const workerAvatar = hasPreselectedWorker ? service.workerAvatar : null;
    const workerAccepted = Boolean(hasPreselectedWorker);

    const bookingPayload = {
      customerId: currentUser?.uid || 'guest_user',
      customerName: currentUser?.name || 'Valued Customer',
      customerPhone: currentUser?.phone || '9876543210',
      workerId,
      workerName,
      workerTitle: workerName ? 'JOBit Verified Technician' : 'Dispatch Assignment Pending',
      workerPhone,
      workerAvatar,
      workerAccepted,
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
      address: finalAddress,
      houseName: houseName.trim(),
      plusCode: plusCode || '',
      detailedAddress: {
        houseName: houseName.trim(),
        areaAddress: address.trim(),
        fullAddress: finalAddress,
        plusCode: plusCode || ''
      },
      user_latitude: Number(Number(coordinates.lat).toFixed(6)),
      user_longitude: Number(Number(coordinates.lng).toFixed(6)),
      latitude: Number(Number(coordinates.lat).toFixed(6)),
      longitude: Number(Number(coordinates.lng).toFixed(6)),
      lat: Number(Number(coordinates.lat).toFixed(6)),
      lng: Number(Number(coordinates.lng).toFixed(6)),
      isGpsVerified: true,
      is_gps_verified: true,
      coordinates: {
        lat: Number(Number(coordinates.lat).toFixed(6)),
        lng: Number(Number(coordinates.lng).toFixed(6))
      },
      dateTime: `${date} at ${timeSlot}`,
      note: note.trim() 
        ? `Issue: ${selectedSubCategory}. Note: ${note.trim()}`
        : `Issue: ${selectedSubCategory}`,
      status: 'pending', // Pending worker acceptance
      paymentStatus: 'paid_visiting_fee_99',
      paymentId: 'pay_' + Date.now(),
      city: cleanCity
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
              {confirmedBookingData ? 'Booking Status' : `Book ${service.title}`}
            </h3>
            <p className="text-xs text-[#0EA5E0] font-bold mt-0.5">
              {confirmedBookingData ? 'Request Dispatched' : 'Flat ₹99 Visiting Charge • Doorstep Inspection'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {!isAvailable ? (
          /* ========================================================= */
          /* UNIFIED COMING SOON TO YOUR AREA STATE                    */
          /* ========================================================= */
          <div className="py-8 text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-3xl shadow-sm border border-amber-200">
              🛠️
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#0EA5E0]" />
                <span>{cleanCity}</span>
              </div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                Coming Soon to Your Area!
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
                We are currently onboarding and verifying top certified technicians in <strong className="text-slate-900">{cleanCity}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50 text-left text-xs space-y-1 text-slate-600 border border-sky-100">
              <div className="flex items-center gap-1.5 text-sky-800 font-extrabold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0EA5E0]" />
                <span>JOBit Safety & Availability Standard</span>
              </div>
              <p className="text-[11px]">
                Direct booking unlocks automatically as soon as an Admin-approved technician is verified in your area.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-black transition cursor-pointer shadow-sm"
            >
              Explore Other Services
            </button>
          </div>
        ) : confirmedBookingData ? (
          /* ========================================================= */
          /* BOOKING CONFIRMED SCREEN - REQUEST DISPATCHED             */
          /* ========================================================= */
          <div className="py-6 space-y-4 animate-scale-up text-left">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide uppercase">
                {confirmedBookingData.workerName ? 'Booking Request Submitted' : 'Booking Confirmed - Request Dispatched'}
              </span>
              <h4 className="text-xl font-black text-slate-900">
                {confirmedBookingData.serviceTitle || service.title}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Flat ₹99 Visiting Charge confirmed. Finding verified technicians in {cleanCity}...
              </p>
            </div>

            {/* In portfolio bookings with preselected pro, show chosen pro card */}
            {confirmedBookingData.workerName ? (
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={confirmedBookingData.workerAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=200&q=80"}
                    alt={confirmedBookingData.workerName}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-xs"
                  />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Requested Pro</p>
                    <p className="text-sm font-black text-slate-900">{confirmedBookingData.workerName}</p>
                    <p className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Portfolio Verified Pro</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Non-portfolio trade: Searching nearby verified technician */
              <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0EA5E0]"></span>
                  </span>
                  <div>
                    <p className="text-xs font-black text-slate-900">Broadcasting Request to Nearby Technicians</p>
                    <p className="text-[11px] text-slate-500 font-medium">Hyperlocal radius: {cleanCity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold bg-white/80 p-2 rounded-xl border border-sky-100/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0EA5E0] shrink-0" />
                  <span>Technician details, direct call & chat options will unlock as soon as a technician accepts your request.</span>
                </div>
              </div>
            )}

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
                <div className="text-right max-w-[220px]">
                  <span className="font-semibold text-slate-800 block break-words whitespace-normal leading-relaxed">{confirmedBookingData.address}</span>
                </div>
              </div>
              {Boolean((confirmedBookingData.user_latitude || confirmedBookingData.latitude) && (confirmedBookingData.user_longitude || confirmedBookingData.longitude)) && (
                <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="font-medium text-slate-600">Location:</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${confirmedBookingData.user_latitude || confirmedBookingData.latitude},${confirmedBookingData.user_longitude || confirmedBookingData.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0EA5E0] hover:underline font-bold flex items-center gap-1 text-xs"
                    title="Open in Google Maps"
                  >
                    <span>View in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Redirect / Finish Button */}
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-4 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white font-black text-sm shadow-[0_12px_28px_-6px_rgba(14,165,224,0.45)] active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Track in My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* BOOKING FORM - PURELY COLLECTS DETAILS                    */
          /* ========================================================= */
          <form onSubmit={handleConfirm} className="space-y-4 pt-4">
            
            {/* ONLY display technician if this is a portfolio trade where user selected a specific pro */}
            {hasPreselectedWorker && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-sky-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={service.workerAvatar || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80"}
                    alt={service.workerName}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-2xs"
                  />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-600" />
                      <span>Selected Portfolio Pro • {cleanCity}</span>
                    </span>
                    <p className="text-xs font-black text-slate-900">{service.workerName}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{maskPhoneNumber(service.workerPhone)}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>Selected</span>
                </span>
              </div>
            )}

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

            {/* ======================================================= */}
            {/* SERVICE ADDRESS & MAP PIN LOCATION                      */}
            {/* ======================================================= */}
            <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl p-3.5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  Region: {cleanCity}
                </span>
              </div>

              {/* 1. Address Text Input FIRST */}
              <div>
                <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0EA5E0]" />
                  <span>Address Details (House / Flat / Building) <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={houseName}
                  onChange={(e) => {
                    setHouseName(e.target.value);
                    if (!touched.address) setTouched((prev) => ({ ...prev, address: true }));
                  }}
                  placeholder="e.g. Flat 302, Rose Villa, 2nd Floor, Main Road"
                  className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0] transition"
                />
              </div>

              {/* 2. Followed by Area / Location selection on Map BENEATH it */}
              <LocationPickerField
                label="Area / Landmark on Map"
                value={address}
                coordinates={coordinates}
                plusCode={plusCode}
                service={service}
                workers={workers}
                onChange={({ address: resolvedAddress, coordinates: newCoords, plusCode: code }) => {
                  setAddress(resolvedAddress);
                  if (newCoords) setCoordinates(newCoords);
                  if (code) setPlusCode(code);
                  if (!touched.address) setTouched((prev) => ({ ...prev, address: true }));
                }}
                required
                placeholder="Tap to pinpoint location on map..."
                error={touched.address && !isAddressValid ? "Please enter address or select location on map" : ""}
              />
            </div>

            {/* Date Picker - Strictly required with no pre-selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#4B6EF5]" />
                  <span>Preferred Date <span className="text-rose-500">*</span></span>
                </label>
                {!date && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                min={todayString}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (!touched.date) setTouched((prev) => ({ ...prev, date: true }));
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, date: true }))}
                className={`w-full p-3 bg-[#F8FAFC] border rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none transition-colors ${
                  touched.date && !isDateValid
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-slate-200 focus:border-[#4B6EF5] focus:bg-white'
                }`}
              />
              {touched.date && !isDateValid && (
                <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Please select a service date</span>
                </p>
              )}
            </div>

            {/* Time Slot Selector - Strictly required with no pre-selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4B6EF5]" />
                  <span>Time Slot <span className="text-rose-500">*</span></span>
                </label>
                {!timeSlot && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  '09:00 AM - 11:00 AM',
                  '11:00 AM - 01:00 PM',
                  '02:00 PM - 04:00 PM',
                  '04:00 PM - 06:00 PM'
                ].map((slot) => {
                  const isSelected = timeSlot === slot;
                  const isPassed = isTimeSlotPassed(slot, date);
                  return (
                    <button
                      type="button"
                      key={slot}
                      disabled={isPassed}
                      onClick={() => {
                        if (isPassed) return;
                        setTimeSlot(slot);
                        if (!touched.timeSlot) setTouched((prev) => ({ ...prev, timeSlot: true }));
                      }}
                      className={`p-2.5 rounded-2xl text-[11px] font-bold border transition flex items-center justify-between ${
                        isPassed
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                          : isSelected
                            ? 'bg-[#EAF0FF] border-[#4B6EF5] text-[#4B6EF5] shadow-xs ring-1 ring-[#4B6EF5] cursor-pointer'
                            : 'bg-[#F8FAFC] border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <span className={isPassed ? 'line-through text-slate-400' : ''}>{slot}</span>
                      {isPassed ? (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded-md">Passed</span>
                      ) : (
                        isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#4B6EF5]" />
                      )}
                    </button>
                  );
                })}
              </div>
              {date === todayString && [
                '09:00 AM - 11:00 AM',
                '11:00 AM - 01:00 PM',
                '02:00 PM - 04:00 PM',
                '04:00 PM - 06:00 PM'
              ].every((s) => isTimeSlotPassed(s, date)) && (
                <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-xl mt-2 flex items-center gap-1.5 animate-fade-in">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>All time slots for today have already passed. Please choose a future date.</span>
                </p>
              )}
              {touched.timeSlot && !isTimeSlotValid && (
                <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Please select an available preferred time slot</span>
                </p>
              )}
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

            {/* Clear Validation Error Notification if any field is missing */}
            {!isFormValid && (touched.address || touched.date || touched.timeSlot) && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Required fields missing before booking:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {!isAddressValid && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                      • Address
                    </span>
                  )}
                  {!isDateValid && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                      • Service Date
                    </span>
                  )}
                  {!isTimeSlotValid && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                      • Time Slot
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Out-of-Range / Dark Area Overlay or Badge (Swiggy / Zomato style) */}
            {isCoordinatesValid && !radiusAvailability.isAvailable && (
              <div className="p-3.5 rounded-2xl bg-amber-50/95 border border-amber-200 text-amber-900 flex items-center gap-2.5 animate-fade-in shadow-2xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs font-bold leading-snug">
                  Service currently unavailable in this location. We are expanding soon!
                </p>
              </div>
            )}

            {/* Submit Button - Disabled until user explicitly selects Address, Date, Time Slot, and location is in range */}
            <button
              type="submit"
              disabled={!isFormValid || loading || !isLocationAvailable}
              className={`w-full py-4 rounded-full font-extrabold text-sm transition flex items-center justify-center gap-2 ${
                !isFormValid || loading || !isLocationAvailable
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60 shadow-none'
                  : 'bg-[#0EA5E0] hover:bg-[#0284C7] text-white shadow-[0_12px_28px_-6px_rgba(14,165,224,0.45)] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {loading ? (
                'Confirming...'
              ) : !isLocationAvailable ? (
                'Service Unavailable in this Location'
              ) : !isFormValid ? (
                'Select Address, Date & Time to Book'
              ) : (
                'Confirm Booking • Pay Flat ₹99'
              )}
            </button>
          </form>
        )}

        {/* Agora In-App Voice Call Modal */}
        {confirmedBookingData && (
          <VoiceCallModal
            isOpen={isVoiceCallOpen}
            onClose={() => setIsVoiceCallOpen(false)}
            booking={confirmedBookingData}
            currentUserRole="customer"
          />
        )}
      </div>
    </div>
  );
}
