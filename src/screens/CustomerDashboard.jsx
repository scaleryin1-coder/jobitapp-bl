import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Bell, 
  ChevronDown, 
  Star, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  PhoneCall,
  X,
  Compass,
  Zap,
  ThumbsUp,
  Headphones,
  Check
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { initialCategories, initialBanners, initialServices } from '../data/seedData';

export function CustomerDashboard({ 
  onSelectCategory, 
  onSelectService, 
  onNavigateTab,
  currentCity,
  onChangeCity,
  onOpenNotifications,
  onUpdateCity
}) {
  const [categories, setCategories] = useState(initialCategories || []);
  const [banners, setBanners] = useState(initialBanners || []);
  const [services, setServices] = useState(initialServices || []);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Real-time GPS Location state
  const [isLocating, setIsLocating] = useState(false);
  const [locationName, setLocationName] = useState(currentCity || 'Fetching your location...');
  const [locationNotice, setLocationNotice] = useState('');

  // Interactive Search Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Sync prop changes for currentCity
  useEffect(() => {
    if (currentCity && !isLocating) {
      setLocationName(currentCity);
    }
  }, [currentCity, isLocating]);

  // Firestore Real-time Sync
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    let unsubCategories = () => {};
    let unsubBanners = () => {};
    let unsubServices = () => {};

    try {
      unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          items.sort((a, b) => (a.order || 0) - (b.order || 0));
          setCategories(items);
        }
      }, () => {});

      unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const active = items.filter(b => b?.active !== false).sort((a, b) => (a?.order || 0) - (b?.order || 0));
          if (active.length > 0) setBanners(active);
        }
      }, () => {});

      unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setServices(items);
        }
      }, () => {});
    } catch {
      // Quiet offline fallback
    }

    return () => {
      unsubCategories();
      unsubBanners();
      unsubServices();
    };
  }, []);

  // Auto-sliding banner timer
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners?.length]);

  // Click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Device Geolocation via navigator.geolocation
  const fetchLiveGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation not supported by this browser.');
      setTimeout(() => setLocationNotice(''), 3000);
      return;
    }

    setIsLocating(true);
    setLocationNotice('Detecting GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode via OpenStreetMap reverse API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'JobitHomeServicesWeb/1.0'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            const neighborhood = address.suburb || address.neighbourhood || address.residential || address.road || address.hamlet;
            const city = address.city || address.town || address.county || address.state_district || address.state;
            
            const resolvedName = neighborhood && city 
              ? `${neighborhood}, ${city}` 
              : city || `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;

            setLocationName(resolvedName);
            onUpdateCity?.(resolvedName);
            setLocationNotice(`GPS Locked: ${resolvedName}`);
          } else {
            const coordStr = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
            setLocationName(coordStr);
            onUpdateCity?.(coordStr);
            setLocationNotice('GPS coordinates captured');
          }
        } catch (err) {
          const coordStr = `Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`;
          setLocationName(coordStr);
          onUpdateCity?.(coordStr);
          setLocationNotice('GPS acquired');
        } finally {
          setIsLocating(false);
          setTimeout(() => setLocationNotice(''), 3500);
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Could not access device location';
        if (error.code === 1) msg = 'Location access permission was denied';
        if (error.code === 2) msg = 'Position unavailable';
        if (error.code === 3) msg = 'Location request timed out';
        setLocationNotice(msg);
        setTimeout(() => setLocationNotice(''), 3500);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Filter services by search query
  const searchResults = (services || []).filter(s => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return (
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.categoryName && s.categoryName.toLowerCase().includes(q)) ||
      (s.badge && s.badge.toLowerCase().includes(q)) ||
      (s.about && s.about.toLowerCase().includes(q)) ||
      (s.details && s.details.some(d => d.toLowerCase().includes(q)))
    );
  });

  const activeBanner = (banners && banners[activeBannerIdx]) || (initialBanners && initialBanners[0]) || {
    title: "Book Trusted Services",
    subtitle: "Get quick access to home services your location.",
    serviceName: "Home Repair",
    price: 300,
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=500&q=80"
  };

  const filteredServices = (services || []).filter(s => {
    if (!s) return false;
    if (selectedCategoryFilter === 'all') return true;
    return s.categoryId === selectedCategoryFilter;
  });

  const displayedServices = filteredServices.length > 0 ? filteredServices : (services || []);

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-28 text-slate-900 select-none">
      
      {/* 1. Header with 'JOBIT' Brand Logo & Live GPS Location Selector */}
      <header className="bg-white px-5 pt-3.5 pb-3 border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center justify-between">
          
          {/* JOBIT Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0EA5E0] to-[#38BDF8] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center tracking-tight leading-none">
                <span className="text-base font-black text-slate-900">JOB</span>
                <span className="text-base font-black text-[#0EA5E0]">IT</span>
              </div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">
                Hyperlocal Pro
              </p>
            </div>
          </div>

          {/* Interactive Real-Time GPS Location Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchLiveGPSLocation}
              disabled={isLocating}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer shadow-xs ${
                isLocating 
                  ? 'bg-sky-50 border-sky-300 text-[#0EA5E0]' 
                  : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800'
              }`}
              title="Click to detect real device GPS location"
            >
              <div className="w-5 h-5 rounded-full bg-sky-100 text-[#0EA5E0] flex items-center justify-center shrink-0">
                <MapPin className={`w-3 h-3 fill-[#0EA5E0] ${isLocating ? 'animate-bounce' : ''}`} />
              </div>
              <div className="text-left max-w-[130px] sm:max-w-[160px]">
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">
                  {isLocating ? 'Detecting GPS...' : 'Current Location'}
                </p>
                <p className="text-[11px] font-extrabold text-slate-900 truncate leading-tight mt-0.5">
                  {locationName}
                </p>
              </div>
              <Compass className={`w-3.5 h-3.5 text-slate-400 shrink-0 ${isLocating ? 'animate-spin text-[#0EA5E0]' : ''}`} />
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications || (() => alert('You have no new alerts. All services are up-to-date!'))}
              className="w-8 h-8 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 transition relative cursor-pointer shrink-0"
              title="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[2]" />
              <span className="w-2 h-2 rounded-full bg-[#0EA5E0] absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>
          </div>
        </div>

        {/* GPS Status Toast Notice */}
        {locationNotice && (
          <div className="mt-2 py-1 px-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] font-bold text-[#0EA5E0] flex items-center gap-1.5 animate-fade-in">
            <Compass className="w-3.5 h-3.5 animate-spin" />
            <span>{locationNotice}</span>
          </div>
        )}

        {/* 2. Interactive Search Bar with Real-time Dropdown Suggestions */}
        <div ref={searchContainerRef} className="relative mt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search services (e.g. Plumbing, AC, Cleaning, Electrician)..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0EA5E0] focus:bg-white transition shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Real-time Autocomplete Dropdown List */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto no-scrollbar animate-fade-in">
              <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Matching Home Services ({searchResults.length})
                </span>
                <span className="text-[10px] font-bold text-[#0EA5E0]">Instant Select</span>
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => {
                        onSelectService?.(service);
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                      className="p-3 hover:bg-sky-50/70 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={service.heroImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80"} 
                          alt={service.title}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-900 group-hover:text-[#0EA5E0] transition">
                            {service.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {service.categoryName} • ★ {service.rating || 4.9} ({service.ordersCompleted || 500}+ done)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">₹{service.price}/hr</span>
                        <div className="text-[10px] font-extrabold text-[#0EA5E0] flex items-center justify-end gap-0.5 mt-0.5">
                          <span>Book</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <p className="font-bold text-slate-600">No service found for "{searchQuery}"</p>
                  <p className="text-[11px] mt-1">Try keywords like Plumbing, AC Repair, Cleaning, or Electrician</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Search Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-0.5">
            {['Plumbing', 'AC Repair', 'Cleaning', 'Electrician', 'Painting', 'Carpenter'].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setSearchQuery(chip);
                  setIsSearchFocused(true);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-[#0EA5E0] text-[10px] font-bold text-slate-600 transition whitespace-nowrap cursor-pointer shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 3. Auto-sliding Promotional Banner Carousel */}
      <div className="px-5 pt-3 pb-2">
        <div className="relative w-full rounded-[24px] bg-gradient-to-r from-[#2B8FD8] to-[#6FD0EE] p-4 overflow-hidden shadow-lg shadow-sky-400/20 text-white min-h-[155px] flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 w-[48%] h-full pointer-events-none flex items-end justify-end">
            <img
              src={activeBanner.image || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=500&q=80"}
              alt="Worker"
              className="h-full object-cover object-top scale-110"
            />
          </div>

          <div className="relative z-10 max-w-[58%]">
            <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Promotional Offer
            </span>
            <h3 className="text-lg font-extrabold tracking-tight leading-tight mt-1.5">
              {activeBanner.title || "Book Trusted Services"}
            </h3>
            <p className="text-[10px] text-white/85 font-medium mt-1 leading-snug">
              {activeBanner.subtitle || "Get quick access to home services in your location."}
            </p>
          </div>

          <div className="relative z-10 mt-2 max-w-[62%] bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-2 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-white leading-tight">
                {activeBanner.serviceName || "Home Repair"}
              </p>
              <p className="text-[10px] font-semibold text-white/90">
                ₹{activeBanner.price || 300}/hour
              </p>
            </div>
            <button
              onClick={() => {
                const target = (services || []).find(s => s?.title && s.title.toLowerCase().includes((activeBanner.serviceName || '').toLowerCase())) || (services && services[0]);
                if (target) onSelectService(target);
              }}
              className="px-2.5 py-1 rounded-full bg-white text-[#2B8FD8] font-extrabold text-[10px] shadow-sm ml-1.5 whitespace-nowrap active:scale-95 transition cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Carousel Dots */}
        {banners && banners.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBannerIdx(i)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  i === activeBannerIdx 
                    ? 'w-4 h-1.5 bg-[#0EA5E0]' 
                    : 'w-1.5 h-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. "Select Category" Horizontal Scroll */}
      <div className="pt-2 pb-3">
        <div className="px-5 mb-2.5 flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-slate-900">Select Category</h4>
          {selectedCategoryFilter !== 'all' && (
            <button 
              onClick={() => setSelectedCategoryFilter('all')}
              className="text-[11px] font-bold text-[#0EA5E0] hover:underline cursor-pointer"
            >
              All Categories
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-5">
          {(categories || []).map((cat) => {
            if (!cat) return null;
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <div
                key={cat.id || Math.random()}
                onClick={() => {
                  setSelectedCategoryFilter(prev => prev === cat.id ? 'all' : cat.id);
                  onSelectCategory?.(cat);
                }}
                className="flex flex-col items-center shrink-0 cursor-pointer group"
              >
                <div className={`w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-[#0EA5E0]/30 border-2 border-[#0EA5E0] shadow-sm' 
                    : 'border border-slate-100 group-hover:border-slate-200'
                }`}>
                  <img
                    src={cat.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80"}
                    alt={cat.name || "Category"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-[11px] font-bold mt-1 text-center leading-tight transition ${
                  isSelected ? 'text-[#0EA5E0]' : 'text-slate-800'
                }`}>
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. "Near For You" Featured Services Grid */}
      <div className="px-5 pt-1">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Near For You</h4>
            <p className="text-[10px] text-slate-400 font-semibold">Available pros within 5 km</p>
          </div>
          <button 
            onClick={() => onNavigateTab?.('bookings')}
            className="text-xs font-bold text-[#0EA5E0] hover:underline transition cursor-pointer"
          >
            My Bookings ➔
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {displayedServices.map((service) => {
            if (!service) return null;
            return (
              <div
                key={service.id || Math.random()}
                onClick={() => onSelectService(service)}
                className="relative h-44 rounded-[24px] overflow-hidden shadow-sm border border-slate-100 cursor-pointer group active:scale-[0.99] transition-all duration-200"
              >
                <img
                  src={service.heroImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"}
                  alt={service.title || "Service"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-extrabold text-slate-900 shadow-sm flex items-center gap-1">
                  <span className="text-amber-400">★</span>
                  <span>{service.rating || '4.9'}</span>
                  <span className="text-slate-400 font-semibold">({service.reviewCount || 'Review'})</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-8 pb-3 px-3.5 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">
                      {service.categoryName || 'Verified Pro'}
                    </span>
                    <p className="text-xs font-bold text-white leading-tight mt-0.5">
                      {service.title || "Home Service"}
                    </p>
                    <p className="text-[11px] font-semibold text-white/90">
                      ₹{service.price || 300}/hour
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-[#0EA5E0] transition-colors shadow-sm">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          6. EXTENDED SCROLLABLE PROFESSIONAL LAYOUT:
             - Why Choose JOBIT & Trust Indicators
             - 7-Day Guarantee Box
             - Informative About Jobit
             - Customer Testimonials
             - Comprehensive Footer
         ========================================================================= */}

      {/* Why Choose JOBIT? Trust Grid */}
      <div className="px-5 pt-8">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-50 text-[#0EA5E0] text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>The JOBIT Standard</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Why Urban Homes Trust JOBIT</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
            Transparent pricing, certified professionals, and zero-compromise safety.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-black text-slate-900">100% Verified Pros</h5>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Every technician passes strict criminal background and in-person trade testing.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0EA5E0] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-black text-slate-900">Fixed Upfront Pricing</h5>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              No hidden quotes or hourly stretching. Pay exactly what was confirmed upfront.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-black text-slate-900">15-Min Fast Dispatch</h5>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Instant hyperlocal allocation brings technicians straight to your doorstep on time.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-black text-slate-900">Pay Post Service</h5>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Zero upfront booking charges. Pay securely only after 100% job satisfaction.
            </p>
          </div>
        </div>
      </div>

      {/* JOBIT 7-Day Guarantee Card */}
      <div className="px-5 pt-6">
        <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0EA5E0] flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight">JOBIT Peace of Mind Guarantee</h4>
                <p className="text-[10px] text-sky-300 font-semibold">Included on all service bookings</p>
              </div>
            </div>
            <span className="text-[9px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full text-white">
              7-Day Cover
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-white/90">
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>7-Day Free Re-work Warranty</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Up to ₹10,000 Damage Protection</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Dedicated 24/7 Helpline Support</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero-Spam Contactless Calling</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informative 'About Jobit' Section */}
      <div className="px-5 pt-6">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0EA5E0] flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-[#0EA5E0]" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">About JOBIT</h4>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            JOBIT is a modern hyperlocal home services marketplace that connects urban households directly with certified trade specialists — including licensed plumbers, HVAC technicians, deep cleaning teams, and electricians.
          </p>

          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Our mission is to replace uncertain roadside service quotes with standardized, fixed task pricing, real-time GPS dispatching, and verified service quality.
          </p>

          {/* Key Metrics Banner */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50">
              <p className="text-sm font-black text-slate-900">50K+</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Homes Served</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <p className="text-sm font-black text-[#0EA5E0]">1,200+</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Verified Pros</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <p className="text-sm font-black text-amber-500">4.9 ★</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Average Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Testimonials Carousel/Cards */}
      <div className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-slate-900">What Our Customers Say</h4>
          <span className="text-[11px] font-bold text-amber-500">★ 4.9 on Google Reviews</span>
        </div>

        <div className="space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" 
                  alt="Customer" 
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Ananya Verma</p>
                  <p className="text-[9px] text-slate-400">AC Jet Wash • Verified Booking</p>
                </div>
              </div>
              <div className="text-amber-400 text-xs">★★★★★</div>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
              "The AC specialist arrived in 20 minutes with pressure washers. Zero mess left on the floor and my split AC cooling is like brand new."
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" 
                  alt="Customer" 
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Vikramaditya Roy</p>
                  <p className="text-[9px] text-slate-400">Plumbing Leak Fix • Verified Booking</p>
                </div>
              </div>
              <div className="text-amber-400 text-xs">★★★★★</div>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
              "Finally an app that doesn't charge ₹500 just for visiting! Fixed pricing and the technician was extremely polite and professional."
            </p>
          </div>
        </div>
      </div>

      {/* 7. Professional Footer */}
      <footer className="px-5 pt-8 pb-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-[#0EA5E0] flex items-center justify-center text-white">
            <Sparkles className="w-3 h-3 fill-white" />
          </div>
          <span className="text-xs font-black tracking-tight text-slate-800">JOB<span className="text-[#0EA5E0]">IT</span> Services Inc.</span>
        </div>
        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
          Hyperlocal home service marketplace connecting certified trade professionals with homeowners.
        </p>
        <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-400 pt-1">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
          <span>•</span>
          <span>Help & Safety</span>
        </div>
        <p className="text-[9px] text-slate-300 pt-1">© 2026 JOBIT. All rights reserved.</p>
      </footer>

    </div>
  );
}

// Re-export as HomeScreen for backwards compatibility
export { CustomerDashboard as HomeScreen };
