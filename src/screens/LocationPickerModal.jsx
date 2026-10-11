import React, { useState } from 'react';
import { X, MapPin, Compass, Search, Check, Sparkles } from 'lucide-react';

export function LocationPickerModal({ isOpen, onClose, currentCity, onSelectLocation }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [manualQuery, setManualQuery] = useState('');

  if (!isOpen) return null;

  const popularCities = [
    { name: 'Melattur, Kerala', area: 'Town Center, Railway Station Road, Malappuram' },
    { name: 'Perinthalmanna, Kerala', area: 'Bypass Road, Angadippuram, Malappuram' },
    { name: 'Manjeri, Kerala', area: 'Court Road, Pandikkad Road, Malappuram' },
    { name: 'Malappuram, Kerala', area: 'Kottakkunnu, Up Hill, Down Hill' },
    { name: 'Kozhikode, Kerala', area: 'Mavoor Road, Beach, Palayam' },
    { name: 'Kochi, Kerala', area: 'Edappally, Kakkanad, Fort Kochi' },
    { name: 'Bengaluru, Karnataka', area: 'Koramangala, Indiranagar, HSR' },
    { name: 'Mumbai, Maharashtra', area: 'Bandra, Andheri, Colaba' },
    { name: 'Delhi NCR', area: 'Connaught Place, Noida, Gurugram' }
  ];

  const handleTriggerLiveGPS = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setStatusMessage('Requesting GPS permission from device...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setStatusMessage('Resolving neighborhood & city...');

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
            onSelectLocation(resolvedLocation);
            setIsDetecting(false);
            onClose();
          } else {
            const fallback = `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
            localStorage.setItem('jobit_user_location', fallback);
            onSelectLocation(fallback);
            setIsDetecting(false);
            onClose();
          }
        } catch {
          const fallback = `GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;
          localStorage.setItem('jobit_user_location', fallback);
          onSelectLocation(fallback);
          setIsDetecting(false);
          onClose();
        }
      },
      (err) => {
        setIsDetecting(false);
        if (err.code === 1) {
          setStatusMessage('Location access permission was denied in your browser.');
        } else if (err.code === 2) {
          setStatusMessage('Position unavailable from GPS hardware.');
        } else {
          setStatusMessage('Location request timed out. Please choose a city below.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const filteredCities = popularCities.filter(c => 
    c.name.toLowerCase().includes(manualQuery.toLowerCase()) ||
    c.area.toLowerCase().includes(manualQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Select Service Location</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Available certified technicians are dispatched locally
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F1F3F5] text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Live Trigger Button */}
        <div className="pt-3 pb-2 shrink-0">
          <button
            onClick={handleTriggerLiveGPS}
            disabled={isDetecting}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white text-xs font-black shadow-glow flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition cursor-pointer"
          >
            <Compass className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detecting Live GPS...' : 'Use My Live GPS Location'}</span>
          </button>

          {statusMessage && (
            <p className="text-[11px] text-[#0EA5E0] font-semibold text-center mt-2 bg-sky-50 py-1 px-2 rounded-xl">
              {statusMessage}
            </p>
          )}
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
                    <p className="text-xs font-bold leading-tight">{city.name}</p>
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
    </div>
  );
}
