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
import { createBooking, getWorkersForCategoryInLocation, maskPhoneNumber } from '../data/bookingService';
import { useAuth } from '../context/AuthContext';
import { getSubCategoriesForCategory, isPortfolioCategory } from '../data/categoriesData';
import { VoiceCallModal } from '../components/voice/VoiceCallModal';

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

export function BookingModal({ service, isOpen, onClose, onSuccess, currentCity, workers = [] }) {
  const { currentUser } = useAuth() || {};
  const effectiveCity = currentCity || localStorage.getItem('jobit_user_location') || currentUser?.city || 'Melattur, Kerala';
  const cleanCity = effectiveCity.split(',')[0].trim();
  
  // Detailed Text Address fields
  const [houseName, setHouseName] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');

  // Exact Map Pin Coordinates (Latitude & Longitude)
  const [coordinates, setCoordinates] = useState(() => getInitialCoords(effectiveCity));
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');

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

  const isAddressValid = Boolean(
    (address && address.trim().length > 3) ||
    (houseName && houseName.trim().length > 0 && street && street.trim().length > 0)
  );
  const isCoordinatesValid = Boolean(
    coordinates &&
    coordinates.lat !== undefined &&
    coordinates.lng !== undefined &&
    !isNaN(Number(coordinates.lat)) &&
    !isNaN(Number(coordinates.lng))
  );
  const isDateValid = Boolean(date && date.trim().length > 0);
  const isTimeSlotValid = Boolean(timeSlot && timeSlot.trim().length > 0);
  const isFormValid = isAddressValid && isCoordinatesValid && isDateValid && isTimeSlotValid;
  const todayString = new Date().toISOString().split('T')[0];

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
      setStreet('');
      setLandmark('');
      setAddress('');
      setCoordinates(getInitialCoords(effectiveCity));
      setGpsStatusMsg('');
      setDate('');
      setTimeSlot('');
      setNote('');
      setTouched({ address: false, date: false, timeSlot: false });
    }
  }, [isOpen, effectiveCity]);

  // Helper to compose full address string
  const getFullAddress = () => {
    if (address && address.trim().length > 0) return address.trim();
    const parts = [
      houseName.trim(),
      street.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      cleanCity
    ].filter(Boolean);
    return parts.join(', ');
  };

  // High accuracy live GPS detector
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation not supported by this browser.');
      return;
    }
    setIsGpsLocating(true);
    setGpsStatusMsg('Detecting live GPS coordinates from device...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCoordinates({ lat, lng });
        setIsGpsLocating(false);
        setGpsStatusMsg(`GPS Lock Active (±${Math.round(pos.coords.accuracy || 10)}m accuracy)`);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept': 'application/json', 'User-Agent': 'JobitHomeServicesWeb/1.0' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || '';
            const lm = addr.amenity || addr.building || addr.landmark || '';
            if (!street && road) setStreet(road);
            if (!landmark && lm) setLandmark(lm);
          }
        } catch {
          // Reverse geocoding optional fallback
        }
      },
      (err) => {
        setIsGpsLocating(false);
        if (err.code === 1) {
          setGpsStatusMsg('Location permission denied in browser.');
        } else {
          setGpsStatusMsg('Unable to retrieve GPS. You can adjust the pin manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const nudgeCoordinates = (deltaLat, deltaLng) => {
    setCoordinates(prev => ({
      lat: Number((prev.lat + deltaLat).toFixed(6)),
      lng: Number((prev.lng + deltaLng).toFixed(6))
    }));
  };

  if (!isOpen || !service) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
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
      street: street.trim(),
      landmark: landmark.trim(),
      detailedAddress: {
        houseName: houseName.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        fullAddress: finalAddress
      },
      latitude: Number(coordinates.lat),
      longitude: Number(coordinates.lng),
      lat: Number(coordinates.lat),
      lng: Number(coordinates.lng),
      coordinates: {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng)
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
                <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{confirmedBookingData.address}</span>
              </div>
              {confirmedBookingData.latitude && confirmedBookingData.longitude && (
                <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="font-medium flex items-center gap-1 text-emerald-700 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Doorstep GPS Pin:</span>
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${confirmedBookingData.latitude},${confirmedBookingData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0EA5E0] hover:underline font-mono font-bold flex items-center gap-1 text-[11px]"
                    title="Open Pin in Google Maps"
                  >
                    <span>{Number(confirmedBookingData.latitude).toFixed(4)}°, {Number(confirmedBookingData.longitude).toFixed(4)}°</span>
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
            {/* SERVICE ADDRESS & EXACT MAP PIN COORDINATES             */}
            {/* ======================================================= */}
            <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#111827] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#4B6EF5]" />
                  <span>Service Address & Doorstep GPS Pin <span className="text-rose-500">*</span></span>
                </label>
                <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {cleanCity}
                </span>
              </div>

              {/* A. Detailed Text Address Fields */}
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 block mb-1">
                    House Name / Flat / Building No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={houseName}
                    onChange={(e) => {
                      setHouseName(e.target.value);
                      if (!touched.address) setTouched((prev) => ({ ...prev, address: true }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
                    placeholder="e.g. Rose Villa, Flat 2B / Building 4"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4B6EF5] transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 block mb-1">
                      Street / Road / Area <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => {
                        setStreet(e.target.value);
                        if (!touched.address) setTouched((prev) => ({ ...prev, address: true }));
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
                      placeholder="e.g. Station Road, Town Center"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4B6EF5] transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-600 block mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Town Mosque"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#4B6EF5] transition"
                    />
                  </div>
                </div>

                {touched.address && !isAddressValid && (
                  <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Please enter house name and street address</span>
                  </p>
                )}
              </div>

              {/* B. Exact Map Pin Section */}
              <div className="pt-2 border-t border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-800 block">
                      Doorstep GPS Map Pin
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Technician opens Google Maps directly to this pin
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isGpsLocating}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0EA5E0] text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-sky-100 disabled:opacity-50"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isGpsLocating ? 'animate-spin' : ''}`} />
                    <span>{isGpsLocating ? 'Locating...' : 'Use My GPS Pin'}</span>
                  </button>
                </div>

                {gpsStatusMsg && (
                  <p className="text-[10px] font-bold text-sky-700 bg-sky-50/90 py-1 px-2 rounded-lg border border-sky-100">
                    {gpsStatusMsg}
                  </p>
                )}

                {/* Live Embedded Map with Interactive Crosshair & Pin */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
                  <iframe
                    title="Doorstep Map Pin"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.005}%2C${coordinates.lat - 0.003}%2C${coordinates.lng + 0.005}%2C${coordinates.lat + 0.003}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`}
                    className="w-full h-32 border-0 pointer-events-none block"
                  />

                  {/* Pin Overlay Badge with Live Coordinates */}
                  <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 text-[10px] font-mono font-bold text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°</span>
                  </div>

                  {/* Google Maps External Verify Link */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-white/95 hover:bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs text-[10px] font-bold text-[#0EA5E0] flex items-center gap-1 transition"
                    title="Preview exact destination in Google Maps"
                  >
                    <span>Verify in Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>

                  {/* Fine-Tuning Nudge Controls Overlay */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[9px] font-bold text-slate-500 px-1">Nudge Pin:</span>
                    <button
                      type="button"
                      onClick={() => nudgeCoordinates(0.0003, 0)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                      title="Nudge North"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeCoordinates(-0.0003, 0)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                      title="Nudge South"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeCoordinates(0, -0.0003)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                      title="Nudge West"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeCoordinates(0, 0.0003)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                      title="Nudge East"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold px-0.5">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Exact Map Coordinates attached to booking</span>
                  </span>
                  <span className="font-mono text-slate-400">
                    {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                  </span>
                </div>
              </div>
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
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => {
                        setTimeSlot(slot);
                        if (!touched.timeSlot) setTouched((prev) => ({ ...prev, timeSlot: true }));
                      }}
                      className={`p-2.5 rounded-2xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#EAF0FF] border-[#4B6EF5] text-[#4B6EF5] shadow-xs ring-1 ring-[#4B6EF5]'
                          : 'bg-[#F8FAFC] border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{slot}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#4B6EF5]" />}
                    </button>
                  );
                })}
              </div>
              {touched.timeSlot && !isTimeSlotValid && (
                <p className="text-[11px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Please select a preferred time slot</span>
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

            {/* Submit Button - Disabled until user explicitly selects Address, Date, and Time Slot */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-4 rounded-full font-extrabold text-sm transition flex items-center justify-center gap-2 ${
                !isFormValid || loading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60 shadow-none'
                  : 'bg-[#0EA5E0] hover:bg-[#0284C7] text-white shadow-[0_12px_28px_-6px_rgba(14,165,224,0.45)] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {loading ? (
                'Confirming...'
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
