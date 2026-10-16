import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Crosshair, 
  MapPin, 
  Compass, 
  Plus, 
  Minus, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Check, 
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export function UrbanLocationPicker({
  coordinates = { lat: 11.0607, lng: 76.2625 },
  onChangeCoordinates,
  onAddressResolved,
  cityContext = 'Melattur, Kerala',
  isSearchingArea = false,
  searchNotice = '',
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const isInternalMoveRef = useRef(false);
  const geocodeTimeoutRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(coordinates);

  // Sync internal state when prop coordinates change from outside (e.g. forward geocoding from street/landmark)
  useEffect(() => {
    if (coordinates?.lat && coordinates?.lng) {
      const targetLat = Number(Number(coordinates.lat).toFixed(6));
      const targetLng = Number(Number(coordinates.lng).toFixed(6));
      if (isNaN(targetLat) || isNaN(targetLng)) return;

      const currentLat = Number(currentCoords?.lat || 0);
      const currentLng = Number(currentCoords?.lng || 0);
      const latDiff = Math.abs(currentLat - targetLat);
      const lngDiff = Math.abs(currentLng - targetLng);

      if (latDiff > 0.00001 || lngDiff > 0.00001) {
        const next = { lat: targetLat, lng: targetLng };
        setCurrentCoords(next);
        if (mapInstanceRef.current && !isInternalMoveRef.current) {
          mapInstanceRef.current.flyTo([targetLat, targetLng], Math.max(mapInstanceRef.current.getZoom(), 16), { 
            duration: 0.6,
            easeLinearity: 0.25 
          });
        }
        fetchAddressDetails(targetLat, targetLng);
      }
    }
  }, [coordinates?.lat, coordinates?.lng]);

  // Reverse geocode helper with debounce
  const fetchAddressDetails = useCallback(async (lat, lng) => {
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setIsResolvingAddress(true);
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'JOBitAppLocationPicker/2.0'
            }
          }
        );

        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const road = addr.road || addr.street || addr.residential || addr.neighbourhood || addr.suburb || '';
          const locality = addr.suburb || addr.village || addr.town || addr.city || addr.county || '';
          const landmark = addr.amenity || addr.building || addr.landmark || '';
          const houseNo = addr.house_number || '';

          const parts = [road, locality].filter(Boolean);
          const shortDisplay = parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || '';
          
          setResolvedAddress(shortDisplay);
          
          if (onAddressResolved) {
            onAddressResolved({
              road,
              locality,
              landmark,
              houseNo,
              fullAddress: data.display_name || '',
              shortAddress: shortDisplay,
              lat,
              lng
            });
          }
        }
      } catch (err) {
        // Fallback silently if offline or rate limited
        console.warn('Geocode lookup warning:', err);
      } finally {
        setIsResolvingAddress(false);
      }
    }, 450);
  }, [onAddressResolved]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up any stale map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = Number(currentCoords.lat) || 11.0607;
    const initialLng = Number(currentCoords.lng) || 76.2625;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      bounceAtZoomLimits: true,
      wheelDebounceTime: 40
    });

    // Add high-clarity OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 4
    }).addTo(map);

    // Event: dragging start
    map.on('movestart', () => {
      setIsDragging(true);
      isInternalMoveRef.current = true;
    });

    // Event: dragging ends - update coordinates to center of map
    map.on('moveend', () => {
      setIsDragging(false);
      const center = map.getCenter();
      const newLat = Number(center.lat.toFixed(6));
      const newLng = Number(center.lng.toFixed(6));
      
      const newCoords = { lat: newLat, lng: newLng };
      setCurrentCoords(newCoords);
      onChangeCoordinates?.(newCoords);
      fetchAddressDetails(newLat, newLng);

      setTimeout(() => {
        isInternalMoveRef.current = false;
      }, 100);
    });

    // Event: user taps anywhere on the map to glide pin directly there
    map.on('click', (e) => {
      map.panTo(e.latlng, { animate: true, duration: 0.4 });
    });

    mapInstanceRef.current = map;

    // Trigger initial geocode resolution
    fetchAddressDetails(initialLat, initialLng);

    // Initial size invalidation to avoid grey tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size on fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullScreen]);

  // One-tap Current Location GPS
  const handleUseCurrentLocation = useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const coords = { lat, lng };

        setCurrentCoords(coords);
        onChangeCoordinates?.(coords);
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, {
            duration: 1.0,
            easeLinearity: 0.25
          });
        }
        fetchAddressDetails(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGpsError('GPS permission was denied. Please allow location access or drag the map.');
        } else {
          setGpsError('GPS signal weak. You can drag the map to set your doorstep pin.');
        }
        setTimeout(() => setGpsError(''), 4000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [onChangeCoordinates, fetchAddressDetails]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      
      {/* Top action row: One-Tap Use Current Location */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#0EA5E0] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0369A1] text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition cursor-pointer disabled:opacity-75"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <Compass className="w-4 h-4 shrink-0 text-white animate-pulse" />
          )}
          <span>{isLocating ? 'Detecting exact GPS...' : 'Use Current Location'}</span>
        </button>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${currentCoords.lat},${currentCoords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs hover:text-[#0EA5E0]"
          title="Verify destination in Google Maps"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Google Maps</span>
        </a>
      </div>

      {gpsError && (
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-1.5 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {isSearchingArea && (
        <div className="p-2 rounded-xl bg-sky-50 border border-sky-100 text-[#0284C7] text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[#0EA5E0]" />
          <span>Centering map on searched area...</span>
        </div>
      )}

      {searchNotice && !isSearchingArea && (
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>{searchNotice}</span>
        </div>
      )}

      {/* Main Interactive Map Canvas */}
      <div 
        className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all bg-slate-100 ${
          isFullScreen 
            ? 'fixed inset-4 z-[999] h-auto shadow-2xl rounded-3xl border-2 border-[#0EA5E0]' 
            : 'h-[230px] sm:h-[260px]'
        }`}
      >
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Center Floating Pin with Shadow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400]">
          <div className="relative flex flex-col items-center">
            
            {/* Minimal Drop Indicator while dragging only */}
            {isDragging && (
              <div className="mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md bg-slate-900 text-white -translate-y-2 animate-fade-in flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Drop pin here</span>
              </div>
            )}

            {/* Pin Body with Lift & Float Animation */}
            <div 
              className={`transform transition-transform duration-150 ease-out origin-bottom ${
                isDragging ? '-translate-y-3 scale-110' : 'translate-y-0 scale-100'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                  <path 
                    d="M19 0C8.50659 0 0 8.50659 0 19C0 30.5 16.5 44.5 18.2 45.8C18.67 46.2 19.33 46.2 19.8 45.8C21.5 44.5 38 30.5 38 19C38 8.50659 29.4934 0 19 0Z" 
                    fill="#0EA5E0" 
                  />
                  <circle cx="19" cy="18" r="8" fill="white" />
                  <circle cx="19" cy="18" r="4.5" fill="#0EA5E0" />
                </svg>
              </div>
            </div>

            {/* Ground Shadow below Pin */}
            <div 
              className={`h-2 rounded-full bg-slate-900/30 blur-[2px] transition-all duration-150 ${
                isDragging ? 'w-3 opacity-25 scale-75' : 'w-5 opacity-70 scale-100'
              }`} 
            />

          </div>
        </div>

        {/* Top-Right Map Controls: Zoom & Fullscreen */}
        <div className="absolute top-2.5 right-2.5 z-[500] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Expand Full Screen'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Bottom Floating Address Bar */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[500] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-sm flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Crosshair className="w-3.5 h-3.5 text-[#0EA5E0] shrink-0" />
            <span className="truncate">
              {isResolvingAddress 
                ? 'Resolving area...' 
                : resolvedAddress || 'Drag map or tap to adjust doorstep pin'}
            </span>
          </div>
        </div>

        {/* Fullscreen close bar */}
        {isFullScreen && (
          <div className="absolute top-3 left-3 z-[600]">
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
              <span>Done</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
