import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  X, 
  Check, 
  Loader2, 
  Search, 
  Compass, 
  Plus, 
  Minus,
  Sparkles,
  Layers,
  Share2
} from 'lucide-react';
import { reverseGeocodeNominatim, encodePlusCode } from '../../utils/locationUtils';

// Fallback baseline coordinates (Melattur, Kerala)
const DEFAULT_CENTER = { lat: 11.0607, lng: 76.2625 };

export function LeafletLocationPickerModal({
  isOpen,
  onClose,
  initialCoordinates,
  initialAddress = '',
  onSelectLocation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Current center coordinates of the map
  const [centerCoords, setCenterCoords] = useState(() => {
    if (initialCoordinates?.lat && initialCoordinates?.lng) {
      return { lat: Number(initialCoordinates.lat), lng: Number(initialCoordinates.lng) };
    }
    return DEFAULT_CENTER;
  });

  // Current reverse-geocoded location data
  const [locationDetails, setLocationDetails] = useState({
    areaTitle: initialAddress ? initialAddress.split(',')[0] : 'Locating Area...',
    fullAddress: initialAddress || 'Fetching address details...',
    shortAddress: initialAddress || '',
    plusCode: encodePlusCode(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
    lat: DEFAULT_CENTER.lat,
    lng: DEFAULT_CENTER.lng
  });

  // Search input inside map view
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingQuery, setIsSearchingQuery] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Debounced reverse geocoding function
  const fetchAddressForCoordinates = useCallback((lat, lng) => {
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setIsGeocoding(true);

    geocodeTimeoutRef.current = setTimeout(async () => {
      const data = await reverseGeocodeNominatim(lat, lng);
      setLocationDetails(data);
      setIsGeocoding(false);
    }, 350);
  }, []);

  // Initialize Full-Screen Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const startLat = Number(centerCoords.lat) || DEFAULT_CENTER.lat;
      const startLng = Number(centerCoords.lng) || DEFAULT_CENTER.lng;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        bounceAtZoomLimits: true
      });

      // Free, high-performance OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 4
      }).addTo(map);

      // Listen to map movement:
      // While moving, set isPanning to true (causes center pin to lift up)
      map.on('movestart', () => {
        setIsPanning(true);
      });

      // On camera idle / move end: recalculate center and reverse geocode
      map.on('moveend', () => {
        setIsPanning(false);
        const center = map.getCenter();
        const lat = Number(center.lat.toFixed(6));
        const lng = Number(center.lng.toFixed(6));
        setCenterCoords({ lat, lng });
        fetchAddressForCoordinates(lat, lng);
      });

      mapInstanceRef.current = map;
      setIsMapReady(true);

      // Invalidate size once visible to prevent grey tiles
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      // Check current GPS location on first load if no specific custom coords passed
      if (!initialCoordinates?.lat && typeof navigator !== 'undefined' && navigator.geolocation) {
        setIsLocatingUser(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const gpsLat = Number(pos.coords.latitude.toFixed(6));
            const gpsLng = Number(pos.coords.longitude.toFixed(6));
            setCenterCoords({ lat: gpsLat, lng: gpsLng });
            map.flyTo([gpsLat, gpsLng], 17, { duration: 0.8 });
            fetchAddressForCoordinates(gpsLat, gpsLng);
            setIsLocatingUser(false);
          },
          () => {
            // Default center fallback
            fetchAddressForCoordinates(startLat, startLng);
            setIsLocatingUser(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        fetchAddressForCoordinates(startLat, startLng);
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setIsMapReady(false);
    };
  }, [isOpen]);

  // Center on User's Current GPS Location
  const handleCenterOnUserGPS = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsLat = Number(pos.coords.latitude.toFixed(6));
        const gpsLng = Number(pos.coords.longitude.toFixed(6));
        setCenterCoords({ lat: gpsLat, lng: gpsLng });
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([gpsLat, gpsLng], 17, {
            duration: 0.9,
            easeLinearity: 0.25
          });
        }
        fetchAddressForCoordinates(gpsLat, gpsLng);
        setIsLocatingUser(false);
      },
      () => {
        setIsLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Address / Landmark forward geocoding with Nominatim
  const handleSearchSubmit = async (e) => {
    e?.preventDefault?.();
    const query = searchQuery.trim();
    if (!query || query.length < 2) return;

    setIsSearchingQuery(true);
    setShowSearchResults(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'JobitAppLocationPicker/2.1'
          }
        }
      );
      if (res.ok) {
        const list = await res.json();
        setSearchResults(list || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingQuery(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setShowSearchResults(false);
    setSearchQuery('');
    const targetLat = Number(Number(result.lat).toFixed(6));
    const targetLng = Number(Number(result.lon).toFixed(6));

    setCenterCoords({ lat: targetLat, lng: targetLng });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetLat, targetLng], 17, { duration: 0.8 });
    }
    fetchAddressForCoordinates(targetLat, targetLng);
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Confirm selection
  const handleConfirmLocation = () => {
    const finalAddress = locationDetails.fullAddress || locationDetails.shortAddress || 'Selected Location';
    onSelectLocation?.({
      address: finalAddress,
      shortAddress: locationDetails.shortAddress || locationDetails.areaTitle,
      areaTitle: locationDetails.areaTitle,
      lat: centerCoords.lat,
      lng: centerCoords.lng,
      plusCode: locationDetails.plusCode,
      pincode: locationDetails.pincode,
      city: locationDetails.city,
      raw: locationDetails
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 animate-fade-in select-none">
      
      {/* 1. TOP HEADER & SEARCH BAR */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-3 sm:p-4 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-transparent pointer-events-auto">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-slate-700 hover:text-slate-900 flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
              title="Close Map"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div className="flex-1 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-100 flex items-center justify-center gap-1.5 text-xs font-black text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-[#0EA5E0] fill-[#0EA5E0]/20" />
              <span>Select Location on Map</span>
            </div>

            {/* GPS Re-center Button in Top Bar */}
            <button
              type="button"
              onClick={handleCenterOnUserGPS}
              disabled={isLocatingUser}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-[#0EA5E0] hover:text-[#0284C7] flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer disabled:opacity-75"
              title="Current GPS Location"
            >
              <Navigation className={`w-5 h-5 fill-current ${isLocatingUser ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Box to quickly jump to areas */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark or street..."
              className="w-full pl-10 pr-9 py-2.5 bg-white/95 backdrop-blur-md border border-white/60 rounded-2xl text-xs font-semibold text-slate-800 shadow-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto no-scrollbar">
              {isSearchingQuery ? (
                <div className="p-4 text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0EA5E0]" />
                  <span>Searching locations...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition"
                  >
                    <MapPin className="w-4 h-4 text-[#0EA5E0] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {item.display_name?.split(',')[0]}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.display_name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 font-semibold">
                  No places found for this search
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 2. FULL-SCREEN LEAFLET MAP CONTAINER */}
      <div className="relative flex-1 w-full h-full bg-slate-200">
        
        {/* Leaflet map canvas */}
        <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* 3. STATIC CENTER PIN (FIXED EXACTLY IN CENTER OF SCREEN) */}
        <div 
          className="absolute top-1/2 left-1/2 pointer-events-none z-[450] flex flex-col items-center justify-end"
          style={{
            transform: `translate(-50%, ${isPanning ? '-115%' : '-100%'})`,
            transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* Location Pin Head & Body */}
          <div className="relative flex items-center justify-center">
            <svg 
              width="44" 
              height="54" 
              viewBox="0 0 44 54" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_8px_16px_rgba(14,165,224,0.55)]"
            >
              {/* Teardrop Pin Silhouette */}
              <path 
                d="M22 0C9.84974 0 0 9.84974 0 22C0 35.5 19.2 52.2 21.1 53.8C21.6 54.2 22.4 54.2 22.9 53.8C24.8 52.2 44 35.5 44 22C44 9.84974 34.1503 0 22 0Z" 
                fill="#0EA5E0"
              />
              {/* Outer white ring */}
              <circle cx="22" cy="22" r="10" fill="white" />
              {/* Inner focal core dot */}
              <circle cx="22" cy="22" r="5.5" fill="#0284C7" />
            </svg>

            {/* Small floating tooltip while panning */}
            {isPanning && (
              <div className="absolute -top-7 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-black px-2.5 py-0.8 rounded-full shadow-lg border border-white/20 animate-fade-in">
                Release to pick doorstep
              </div>
            )}
          </div>

          {/* Dynamic Ground Shadow below the pin tip */}
          <div 
            className="w-4 h-1.5 bg-black/35 rounded-full filter blur-[1.5px] transition-all duration-150"
            style={{
              transform: isPanning ? 'scale(0.65)' : 'scale(1)',
              opacity: isPanning ? 0.3 : 0.6,
              marginTop: '-3px'
            }}
          />
        </div>

        {/* Floating Controls: Zoom in/out */}
        <div className="absolute right-3.5 bottom-60 sm:bottom-56 z-[450] flex flex-col gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 shadow-lg border border-slate-200/80 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 shadow-lg border border-slate-200/80 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Floating Quick Action: GPS Location Button */}
        <div className="absolute left-3.5 bottom-60 sm:bottom-56 z-[450]">
          <button
            type="button"
            onClick={handleCenterOnUserGPS}
            disabled={isLocatingUser}
            className="px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 shadow-lg border border-slate-200/80 flex items-center gap-2 transition active:scale-95 cursor-pointer text-xs font-bold"
          >
            <Compass className={`w-4 h-4 text-[#0EA5E0] ${isLocatingUser ? 'animate-spin' : ''}`} />
            <span>{isLocatingUser ? 'Finding...' : 'My Location'}</span>
          </button>
        </div>

      </div>

      {/* 4. BOTTOM ADDRESS SHEET */}
      <div className="relative z-[500] w-full bg-white rounded-t-[32px] shadow-[0_-10px_35px_rgba(0,0,0,0.18)] p-4 sm:p-5 border-t border-slate-100 flex flex-col shrink-0 max-w-md mx-auto">
        
        {/* Drag handle pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />

        {/* Header indicator row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Selected Point
            </span>
          </div>

          {/* Plus Code Badge */}
          {locationDetails.plusCode && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-[#0284C7] text-[10px] font-mono font-bold">
              <span>Plus Code:</span>
              <span className="font-extrabold">{locationDetails.plusCode}</span>
            </div>
          )}
        </div>

        {/* Address Card Display */}
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#0EA5E0]/10 text-[#0EA5E0] flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            {isGeocoding ? (
              <div className="space-y-1.5 py-1">
                <div className="h-4 bg-slate-200 rounded-md animate-pulse w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md animate-pulse w-full" />
              </div>
            ) : (
              <>
                <h4 className="text-sm font-extrabold text-slate-900 leading-snug truncate">
                  {locationDetails.areaTitle || 'Selected Area'}
                </h4>
                <p className="text-[11px] font-medium text-slate-600 line-clamp-2 leading-relaxed mt-0.5">
                  {locationDetails.fullAddress || `${centerCoords.lat.toFixed(5)}°, ${centerCoords.lng.toFixed(5)}°`}
                </p>
                
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400">
                  <span>GPS: {centerCoords.lat.toFixed(4)}°, {centerCoords.lng.toFixed(4)}°</span>
                  {locationDetails.pincode && (
                    <>
                      <span>•</span>
                      <span>PIN: {locationDetails.pincode}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Primary Confirmation Button */}
        <button
          type="button"
          onClick={handleConfirmLocation}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] active:scale-[0.99] text-white text-sm font-black shadow-[0_8px_25px_-4px_rgba(14,165,224,0.45)] flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Select Location</span>
        </button>

      </div>

    </div>
  );
}
