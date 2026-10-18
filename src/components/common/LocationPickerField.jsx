import React, { useState } from 'react';
import { MapPin, ChevronRight, Compass, CheckCircle2, Sparkles, Navigation, Loader2 } from 'lucide-react';
import { LeafletLocationPickerModal } from './LeafletLocationPickerModal';
import { reverseGeocodeNominatim } from '../../utils/locationUtils';

/**
 * Main Form Field for Location Picking:
 * - Display a clean input box titled "Select Area / Location" with a location icon.
 * - High-accuracy GPS button: Uses HTML5 Geolocation API with enableHighAccuracy: true, timeout: 15000, maximumAge: 0.
 * - Shows "GPS Verified (High Accuracy)" badge when coordinates are captured.
 * - Tapping this box opens the full-screen Leaflet map page/modal.
 * - Confirmed location passes address text and exact user_latitude and user_longitude back to caller.
 */
export function LocationPickerField({
  value = '',
  coordinates = null,
  plusCode = '',
  service = null,
  category = null,
  workers = [],
  onChange,
  label = 'Select Area / Location',
  placeholder = 'Tap to select location on map...',
  required = false,
  error = '',
  className = ''
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocatingDirectly, setIsLocatingDirectly] = useState(false);

  const handleSelectLocation = (data) => {
    const latNum = Number(Number(data.user_latitude ?? data.lat ?? data.latitude).toFixed(6));
    const lngNum = Number(Number(data.user_longitude ?? data.lng ?? data.longitude).toFixed(6));

    // Pass chosen address text and exact coordinates back to Main Form
    onChange?.({
      address: data.address,
      shortAddress: data.shortAddress,
      areaTitle: data.areaTitle,
      user_latitude: latNum,
      user_longitude: lngNum,
      latitude: latNum,
      longitude: lngNum,
      coordinates: { lat: latNum, lng: lngNum },
      lat: latNum,
      lng: lngNum,
      isGpsVerified: true,
      plusCode: data.plusCode,
      pincode: data.pincode,
      city: data.city
    });
  };

  // High accuracy GPS trigger directly from form field
  const handleUseCurrentLocationDirectly = (e) => {
    e.stopPropagation();
    if (!navigator.geolocation) return;

    setIsLocatingDirectly(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latNum = Number(pos.coords.latitude.toFixed(6));
        const lngNum = Number(pos.coords.longitude.toFixed(6));
        try {
          const res = await reverseGeocodeNominatim(latNum, lngNum);
          handleSelectLocation({
            address: res.fullAddress || res.shortAddress || `GPS (${latNum}, ${lngNum})`,
            shortAddress: res.shortAddress,
            areaTitle: res.areaTitle,
            lat: latNum,
            lng: lngNum,
            user_latitude: latNum,
            user_longitude: lngNum,
            latitude: latNum,
            longitude: lngNum,
            plusCode: res.plusCode,
            pincode: res.pincode,
            city: res.city
          });
        } catch {
          handleSelectLocation({
            address: `GPS Pin: ${latNum}°, ${lngNum}°`,
            lat: latNum,
            lng: lngNum,
            user_latitude: latNum,
            user_longitude: lngNum,
            latitude: latNum,
            longitude: lngNum
          });
        } finally {
          setIsLocatingDirectly(false);
        }
      },
      () => {
        setIsLocatingDirectly(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const hasValue = Boolean(value && value.trim().length > 0);
  const hasCoordinates = Boolean(
    coordinates &&
    coordinates.lat !== undefined &&
    coordinates.lng !== undefined &&
    !isNaN(Number(coordinates.lat)) &&
    !isNaN(Number(coordinates.lng)) &&
    Number(coordinates.lat) !== 0
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      
      {/* Field Label & Quick High Accuracy GPS Action */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-[#111827] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0EA5E0]" />
            <span>{label} {required && <span className="text-rose-500">*</span>}</span>
          </label>

          <button
            type="button"
            onClick={handleUseCurrentLocationDirectly}
            disabled={isLocatingDirectly}
            className="text-[10px] font-extrabold text-[#0EA5E0] hover:text-[#0284C7] bg-sky-50 hover:bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-100 flex items-center gap-1 transition active:scale-95 cursor-pointer disabled:opacity-60"
            title="Fetch current location using High Accuracy GPS"
          >
            {isLocatingDirectly ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#0EA5E0]" />
            ) : (
              <Compass className="w-3 h-3 text-[#0EA5E0]" />
            )}
            <span>{isLocatingDirectly ? 'Locating...' : 'Use Current Location'}</span>
          </button>
        </div>
      )}

      {/* Main Interactive Input Box */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsMapModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsMapModalOpen(true);
          }
        }}
        className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left group bg-white hover:border-[#0EA5E0] hover:shadow-sm ${
          error 
            ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' 
            : hasValue 
              ? 'border-slate-200/90 shadow-2xs' 
              : 'border-slate-200 hover:bg-slate-50/50'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Location Icon Circle */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            hasCoordinates 
              ? 'bg-[#0EA5E0] text-white shadow-sm shadow-[#0EA5E0]/30' 
              : 'bg-slate-100 text-slate-400 group-hover:bg-[#0EA5E0]/10 group-hover:text-[#0EA5E0]'
          }`}>
            <MapPin className="w-4 h-4 fill-current" />
          </div>

          {/* Address display text */}
          <div className="min-w-0 flex-1 py-0.5">
            {hasValue ? (
              <>
                <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                  {value}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Tap to adjust pin location on map
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                  {placeholder}
                </p>
                <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                  Tap to drop pin on map
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right Arrow / Action hint */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-black text-[#0EA5E0] group-hover:translate-x-0.5 transition-transform hidden sm:inline">
            {hasValue ? 'Change' : 'Open Map'}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0EA5E0] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-[11px] font-bold text-rose-500 pl-1">
          {error}
        </p>
      )}

      {/* Full-Screen Map Selection Screen Modal */}
      <LeafletLocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialCoordinates={coordinates}
        initialAddress={value}
        service={service}
        category={category || service?.categoryName || service?.title}
        workers={workers}
        onSelectLocation={handleSelectLocation}
      />

    </div>
  );
}
