import React, { useState } from 'react';
import { MapPin, ChevronRight, Compass, CheckCircle2, Sparkles, Navigation } from 'lucide-react';
import { LeafletLocationPickerModal } from './LeafletLocationPickerModal';

/**
 * Main Form Field for Location Picking:
 * - Display a clean input box titled "Select Area / Location" with a location icon.
 * - Tapping this box opens the full-screen Leaflet map page/modal.
 * - Confirmed location passes address text and lat/lng back to caller.
 */
export function LocationPickerField({
  value = '',
  coordinates = null,
  plusCode = '',
  onChange,
  label = 'Select Area / Location',
  placeholder = 'Tap to select location on map...',
  required = false,
  error = '',
  className = ''
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleSelectLocation = (data) => {
    // Pass chosen address text and coordinates back to Main Form
    onChange?.({
      address: data.address,
      shortAddress: data.shortAddress,
      areaTitle: data.areaTitle,
      coordinates: { lat: data.lat, lng: data.lng },
      lat: data.lat,
      lng: data.lng,
      plusCode: data.plusCode,
      pincode: data.pincode,
      city: data.city
    });
  };

  const hasValue = Boolean(value && value.trim().length > 0);

  return (
    <div className={`space-y-1.5 ${className}`}>
      
      {/* Field Label */}
      {label && (
        <label className="text-xs font-black text-[#111827] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0EA5E0]" />
            <span>{label} {required && <span className="text-rose-500">*</span>}</span>
          </span>

          {hasValue && coordinates?.lat && (
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Pinned</span>
            </span>
          )}
        </label>
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
            hasValue 
              ? 'bg-[#0EA5E0] text-white shadow-sm shadow-[#0EA5E0]/30' 
              : 'bg-slate-100 text-slate-400 group-hover:bg-[#0EA5E0]/10 group-hover:text-[#0EA5E0]'
          }`}>
            <MapPin className="w-4 h-4 fill-current" />
          </div>

          {/* Address display text */}
          <div className="min-w-0 flex-1 py-0.5">
            {hasValue ? (
              <>
                <p className="text-xs font-black text-slate-900 truncate leading-snug">
                  {value}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-semibold">
                  {coordinates?.lat && (
                    <span>GPS: {Number(coordinates.lat).toFixed(4)}°, {Number(coordinates.lng).toFixed(4)}°</span>
                  )}
                  {plusCode && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[#0EA5E0]">{plusCode}</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                  {placeholder}
                </p>
                <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                  Tap to drop pin on full-screen map
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
        onSelectLocation={handleSelectLocation}
      />

    </div>
  );
}
