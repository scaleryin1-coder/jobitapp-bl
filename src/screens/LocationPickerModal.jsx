import React, { useState, useEffect } from 'react';
import { X, MapPin, Compass, Search, Check, Sparkles, Navigation, Layers } from 'lucide-react';
import { UrbanLocationPicker } from '../components/common/UrbanLocationPicker';

const PRIMARY_SERVICE_COORDS = { lat: 11.0607, lng: 76.2625 }; // Melattur / Malappuram primary hub

export function LocationPickerModal({ isOpen, onClose, currentCity, onSelectLocation }) {
  const [activeMode, setActiveMode] = useState('map'); // 'map' | 'list'
  const [isDetecting, setIsDetecting] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  
  // Baseline coordinates lookup for key service hubs
  const getCityCoords = (cityName) => {
    const key = (cityName || '').toLowerCase();
    if (key.includes('pattikkad')) return { lat: 11.0267, lng: 76.2081 };
    if (key.includes('pandikkad')) return { lat: 11.1118, lng: 76.2415 };
    if (key.includes('perinthalmanna')) return { lat: 10.9760, lng: 76.2254 };
    if (key.includes('manjeri')) return { lat: 11.1213, lng: 76.1213 };
    if (key.includes('malappuram')) return { lat: 11.0732, lng: 76.0740 };
    if (key.includes('kozhikode')) return { lat: 11.2588, lng: 75.7804 };
    if (key.includes('kochi')) return { lat: 9.9312, lng: 76.2673 };
    if (key.includes('bengaluru')) return { lat: 12.9716, lng: 77.5946 };
    return PRIMARY_SERVICE_COORDS;
  };

  const [mapCoords, setMapCoords] = useState(PRIMARY_SERVICE_COORDS);
  const [pendingAddress, setPendingAddress] = useState(currentCity || 'Melattur, Kerala');

  // 1. On opening location selector: automatically default/center cleanly to primary service area (Melattur/Malappuram)
  // 2. Auto-detect GPS coordinates in the background silently so the pin falls near the user naturally
  useEffect(() => {
    if (!isOpen) return;

    // Center on primary service area by default
    const baseCoords = getCityCoords(currentCity) || PRIMARY_SERVICE_COORDS;
    setMapCoords(baseCoords);
    setPendingAddress(currentCity || 'Melattur, Kerala');

    // Silent background auto-detection
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const coords = { 
            lat: Number(latitude.toFixed(6)), 
            lng: Number(longitude.toFixed(6)) 
          };
          setMapCoords(coords);

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
              {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'JobitHomeServicesWeb/1.0'
                }
              }
            );

            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const neighborhood = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.hamlet;
              const city = addr.city || addr.town || addr.county || addr.state_district || addr.state;
              
              const resolvedLocation = neighborhood && city 
                ? `${neighborhood}, ${city}` 
                : (city || `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);

              setPendingAddress(resolvedLocation);
            }
          } catch {
            // Silently ignore without popups or error warnings
          }
        },
        () => {
          // Silently default to Melattur/Malappuram without any warnings or error banners
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000
        }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Initial Rollout Areas
  const rolloutAreas = [
    { name: 'Melattur, Kerala', short: 'Melattur', area: 'Town Center, Railway Station Road, Malappuram', isRollout: true },
    { name: 'Pattikkad, Kerala', short: 'Pattikkad', area: 'Pattikkad Junction, Perinthalmanna Road, Malappuram', isRollout: true },
    { name: 'Pandikkad, Kerala', short: 'Pandikkad', area: 'Pandikkad Town, Nilambur Road, Malappuram', isRollout: true }
  ];

  const otherCities = [
    { name: 'Perinthalmanna, Kerala', area: 'Bypass Road, Angadippuram, Malappuram' },
    { name: 'Manjeri, Kerala', area: 'Court Road, Pandikkad Road, Malappuram' },
    { name: 'Malappuram, Kerala', area: 'Kottakkunnu, Up Hill, Down Hill' },
    { name: 'Kozhikode, Kerala', area: 'Mavoor Road, Beach, Palayam' },
    { name: 'Kochi, Kerala', area: 'Edappally, Kakkanad, Fort Kochi' },
    { name: 'Bengaluru, Karnataka', area: 'Koramangala, Indiranagar, HSR' }
  ];

  const popularCities = [...rolloutAreas, ...otherCities];

  const handleTriggerLiveGPS = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = { 
          lat: Number(latitude.toFixed(6)), 
          lng: Number(longitude.toFixed(6)) 
        };
        setMapCoords(coords);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'JobitHomeServicesWeb/1.0'
              }
            }
          );

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const neighborhood = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.hamlet;
            const city = addr.city || addr.town || addr.county || addr.state_district || addr.state;
            
            const resolvedLocation = neighborhood && city 
              ? `${neighborhood}, ${city}` 
              : city || `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;

            localStorage.setItem('jobit_user_location', resolvedLocation);
            localStorage.setItem('jobit_user_coords', JSON.stringify(coords));
            onSelectLocation(resolvedLocation);
            setIsDetecting(false);
            onClose();
          } else {
            const fallback = `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
            localStorage.setItem('jobit_user_location', fallback);
            localStorage.setItem('jobit_user_coords', JSON.stringify(coords));
            onSelectLocation(fallback);
            setIsDetecting(false);
            onClose();
          }
        } catch {
          const fallback = `GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;
          localStorage.setItem('jobit_user_location', fallback);
          localStorage.setItem('jobit_user_coords', JSON.stringify(coords));
          onSelectLocation(fallback);
          setIsDetecting(false);
          onClose();
        }
      },
      () => {
        setIsDetecting(false);
        // Silently ignore without popups or error warnings
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000
      }
    );
  };

  const handleConfirmMapLocation = () => {
    const finalLocation = pendingAddress || currentCity || 'Melattur, Kerala';
    localStorage.setItem('jobit_user_location', finalLocation);
    localStorage.setItem('jobit_user_coords', JSON.stringify(mapCoords));
    onSelectLocation(finalLocation);
    onClose();
  };

  const filteredCities = popularCities.filter(c => 
    c.name.toLowerCase().includes(manualQuery.toLowerCase()) ||
    c.area.toLowerCase().includes(manualQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-[28px] p-5 shadow-2xl relative border border-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Select Service Location</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Certified local technicians are dispatched based on this location
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F3F5] text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs: Pin on Map vs City Search */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl mt-3 mb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('map')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'map'
                ? 'bg-white text-[#0EA5E0] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pin on Map</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('list')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'list'
                ? 'bg-white text-[#0EA5E0] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Search Cities</span>
          </button>
        </div>

        {/* Tab 1: Map Pin Dropper */}
        {activeMode === 'map' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pt-1">
            <UrbanLocationPicker
              coordinates={mapCoords}
              onChangeCoordinates={(coords) => {
                setMapCoords(coords);
              }}
              onAddressResolved={({ shortAddress, locality, road }) => {
                const display = shortAddress || [road, locality].filter(Boolean).join(', ');
                if (display) setPendingAddress(display);
              }}
              cityContext={currentCity}
            />

            {/* Confirm Map Pin Location Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmMapLocation}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-black shadow-[0_8px_20px_-4px_rgba(14,165,224,0.4)] flex items-center justify-center gap-2 active:scale-[0.99] transition cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm Location: {pendingAddress || currentCity}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: City List & Search */}
        {activeMode === 'list' && (
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col pt-1">
            
            {/* GPS Live Trigger Button */}
            <div className="pb-2 shrink-0">
              <button
                onClick={handleTriggerLiveGPS}
                disabled={isDetecting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition cursor-pointer"
              >
                <Compass className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Locating...' : 'Use Current Location'}</span>
              </button>
            </div>

            {/* Search input */}
            <div className="relative my-2 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Type city or locality name..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E0]"
              />
            </div>

            {/* City list */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pt-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                Major Service Regions
              </p>
              
              {filteredCities.map((city) => {
                const isSelected = currentCity === city.name;
                return (
                  <div
                    key={city.name}
                    onClick={() => {
                      localStorage.setItem('jobit_user_location', city.name);
                      onSelectLocation(city.name);
                      onClose();
                    }}
                    className={`p-2.5 rounded-2xl transition cursor-pointer flex items-center justify-between border ${
                      isSelected 
                        ? 'bg-sky-50 border-[#0EA5E0] text-[#0EA5E0]' 
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0EA5E0] text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold leading-tight">{city.name}</p>
                          {city.isRollout && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                              Rollout Zone
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{city.area}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#0EA5E0] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
