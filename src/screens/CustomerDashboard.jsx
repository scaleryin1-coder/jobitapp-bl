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
  Check,
  Wrench,
  Flame,
  Layers
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { initialCategories, initialBanners, initialServices } from '../data/seedData';
import { NotificationModal } from './NotificationModal';
import { LocationPickerModal } from './LocationPickerModal';

// Clean, premium vector icon component for Categories matching the primary theme
function CategoryVectorIcon({ id = '', name = '', isSelected = false }) {
  const lower = (id + ' ' + name).toLowerCase();

  let iconSvg = <Sparkles className="w-6 h-6 text-white stroke-[2.2]" />;
  let gradientBg = "from-[#0EA5E0] to-[#38BDF8]";

  if (lower.includes('ac') || lower.includes('air') || lower.includes('cool')) {
    iconSvg = (
      <svg className="w-6 h-6 text-white stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M2 8h20M2 12h20M2 16h20M7 8v8M17 8v8"/>
        <path d="M8 4l2 4M16 4l-2 4M9 20l1-4M15 20l-1-4"/>
      </svg>
    );
    gradientBg = "from-[#0EA5E0] to-[#2563EB]";
  } else if (lower.includes('plumb') || lower.includes('pipe') || lower.includes('tap') || lower.includes('leak')) {
    iconSvg = (
      <svg className="w-6 h-6 text-white stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    );
    gradientBg = "from-[#0284C7] to-[#0EA5E0]";
  } else if (lower.includes('clean') || lower.includes('wash') || lower.includes('sanit')) {
    iconSvg = (
      <svg className="w-6 h-6 text-white stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    );
    gradientBg = "from-[#06B6D4] to-[#0EA5E0]";
  } else if (lower.includes('elect') || lower.includes('wire') || lower.includes('power')) {
    iconSvg = (
      <svg className="w-6 h-6 text-white stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    );
    gradientBg = "from-[#F59E0B] to-[#0EA5E0]";
  } else if (lower.includes('paint') || lower.includes('polish') || lower.includes('brush')) {
    iconSvg = (
      <svg className="w-6 h-6 text-white stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M19 11V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h8"/>
        <path d="M14 8V4M8 8V4M12 18v4M8 22h8"/>
      </svg>
    );
    gradientBg = "from-[#6366F1] to-[#0EA5E0]";
  } else if (lower.includes('carp') || lower.includes('wood') || lower.includes('furniture')) {
    iconSvg = (
      <svg className="w-6 h-6 text-white stroke-[2.2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/>
        <path d="M17.64 4.36a9 9 0 0 1 2 2L15 11l-4-4 4.64-4.64a9 9 0 0 1 2 2z"/>
      </svg>
    );
    gradientBg = "from-[#0EA5E0] to-[#0D9488]";
  }

  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 bg-gradient-to-tr ${gradientBg} ${
      isSelected 
        ? 'ring-3 ring-[#0EA5E0] shadow-glow scale-105' 
        : 'shadow-xs hover:scale-102 hover:shadow-md'
    }`}>
      {iconSvg}
    </div>
  );
}

export function CustomerDashboard({ 
  onSelectCategory, 
  onSelectService, 
  onNavigateTab,
  currentCity,
  onUpdateCity
}) {
  const [categories, setCategories] = useState(initialCategories || []);
  const [banners, setBanners] = useState(initialBanners || []);
  const [services, setServices] = useState(initialServices || []);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Real-time GPS Location state
  const [isLocating, setIsLocating] = useState(false);
  const [locationName, setLocationName] = useState(() => {
    return localStorage.getItem('jobit_user_location') || currentCity || 'Melattur, Kerala';
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationNotice, setLocationNotice] = useState('');

  // Notification Modal state & Unread count badge
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(2);

  // Interactive Search Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Sync prop changes for currentCity if provided
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
      // Quiet fallback
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

  // Direct Real-Time Geolocation via navigator.geolocation
  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      setIsLocationModalOpen(true);
      return;
    }

    setIsLocating(true);
    setLocationNotice('Requesting GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
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
            
            const resolved = neighborhood && city 
              ? `${neighborhood}, ${city}` 
              : city || `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;

            setLocationName(resolved);
            localStorage.setItem('jobit_user_location', resolved);
            onUpdateCity?.(resolved);
            setLocationNotice(`Live GPS: ${resolved}`);
          } else {
            const fallback = `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
            setLocationName(fallback);
            localStorage.setItem('jobit_user_location', fallback);
            onUpdateCity?.(fallback);
          }
        } catch {
          const fallback = `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
          setLocationName(fallback);
          localStorage.setItem('jobit_user_location', fallback);
          onUpdateCity?.(fallback);
        } finally {
          setIsLocating(false);
          setTimeout(() => setLocationNotice(''), 3000);
        }
      },
      (err) => {
        setIsLocating(false);
        const errMsg = err.code === 1 
          ? 'GPS permission denied. Choose your location below.' 
          : 'GPS timed out. Choose your location below.';
        setLocationNotice(errMsg);
        setTimeout(() => setLocationNotice(''), 3500);
        setIsLocationModalOpen(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
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
    subtitle: "Get quick access to home services in your location.",
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
      
      {/* 1. Header Cleanup: Clean 'JOBit' Brand Logo only & Compact Location Selector */}
      <header className="bg-white px-4 pt-3 pb-2.5 border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center justify-between">
          
          {/* Clean 'JOBit' Brand Logo (removed tagline and clutter) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-slate-900">
              JOB<span className="text-[#0EA5E0]">it</span>
            </span>
          </div>

          {/* Compact, Neat Location Selector Banner & Notification */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLocationClick}
              disabled={isLocating}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer shadow-xs ${
                isLocating 
                  ? 'bg-sky-50 border-sky-300 text-[#0EA5E0]' 
                  : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800'
              }`}
              title="Click to change or detect live location (Melattur, Kerala)"
            >
              <MapPin className={`w-3.5 h-3.5 text-[#0EA5E0] shrink-0 ${isLocating ? 'animate-bounce' : 'fill-[#0EA5E0]/20'}`} />
              <div className="text-left max-w-[120px] sm:max-w-[160px]">
                <p className="text-[11px] font-extrabold text-slate-900 truncate leading-tight">
                  {isLocating ? 'Locating...' : locationName}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="w-7 h-7 rounded-full bg-[#F1F3F5] text-slate-700 flex items-center justify-center hover:bg-slate-200 transition relative cursor-pointer shrink-0"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5 stroke-[2]" />
              {unreadNotifCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#0EA5E0] absolute top-1 right-1 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* GPS Status Toast Notice */}
        {locationNotice && (
          <div className="mt-1.5 py-1 px-2.5 bg-sky-50 border border-sky-200 rounded-lg text-[10px] font-bold text-[#0EA5E0] flex items-center gap-1.5 animate-fade-in">
            <Compass className="w-3 h-3 animate-spin shrink-0" />
            <span className="truncate">{locationNotice}</span>
          </div>
        )}
      </header>

      {/* 2. 'Book Trusted Services' Promotional Banner (Moved right up to top directly below header) */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative w-full rounded-[22px] bg-gradient-to-r from-[#2B8FD8] to-[#6FD0EE] p-4 overflow-hidden shadow-md shadow-sky-400/15 text-white min-h-[145px] flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 w-[45%] h-full pointer-events-none flex items-end justify-end">
            <img
              src={activeBanner.image || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=500&q=80"}
              alt="Worker"
              className="h-full object-cover object-top scale-105"
            />
          </div>

          <div className="relative z-10 max-w-[60%]">
            <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Trial Region: Melattur
            </span>
            <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight mt-1.5">
              {activeBanner.title || "Book Trusted Services"}
            </h3>
            <p className="text-[10px] text-white/90 font-medium mt-0.5 leading-snug">
              {activeBanner.subtitle || "Get quick access to home services in your location."}
            </p>
          </div>

          <div className="relative z-10 mt-2 max-w-[65%] bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-2 flex items-center justify-between">
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
              className="px-2.5 py-1 rounded-full bg-white text-[#2B8FD8] font-black text-[10px] shadow-sm ml-1.5 whitespace-nowrap active:scale-95 transition cursor-pointer"
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

      {/* 3. Search Bar Directly Below Banner with Dynamic Real-time Filtering */}
      <div className="px-4 py-2">
        <div ref={searchContainerRef} className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search services or categories (e.g. d, clean, plumb)..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0EA5E0] focus:ring-2 focus:ring-sky-100 transition shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 w-5 h-5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Real-time Dynamic Suggestions & Category Results (Appears cleanly as user types) */}
          {searchQuery.trim().length > 0 && (
            <div className="mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-fade-in divide-y divide-slate-100">
              
              {/* Category Matches */}
              {categories.filter(c => c?.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())).length > 0 && (
                <div className="p-2.5 bg-sky-50/50">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2 px-1">
                    Matching Categories
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {categories
                      .filter(c => c?.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                      .map(cat => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategoryFilter(cat.id);
                            onSelectCategory?.(cat);
                            setSearchQuery('');
                            setIsSearchFocused(false);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-sky-100 shadow-xs hover:border-[#0EA5E0] cursor-pointer transition group"
                        >
                          <CategoryVectorIcon id={cat.id} name={cat.name} isSelected={selectedCategoryFilter === cat.id} />
                          <div>
                            <p className="text-xs font-black text-slate-900 group-hover:text-[#0EA5E0] transition leading-tight">
                              {cat.name}
                            </p>
                            <span className="text-[10px] font-bold text-[#0EA5E0]">Filter</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Service Matches Header */}
              <div className="p-2.5 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Matching Services ({searchResults.length})
                </span>
                <span className="text-[10px] font-bold text-[#0EA5E0]">Instant Book</span>
              </div>

              {/* Service Results List */}
              {searchResults.length > 0 ? (
                <div className="max-h-64 overflow-y-auto no-scrollbar divide-y divide-slate-100">
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
                          <p className="text-xs font-black text-slate-900 group-hover:text-[#0EA5E0] transition leading-tight">
                            {service.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {service.categoryName} • ★ {service.rating || 4.9} ({service.ordersCompleted || 500}+ done)
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
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
                <div className="p-4 text-center text-slate-400 text-xs">
                  <p className="font-bold text-slate-600">No service matching "{searchQuery}"</p>
                  <p className="text-[11px] mt-0.5">Try keywords like Plumbing, AC, Deep Cleaning, or Electrician</p>
                </div>
              )}
            </div>
          )}

          {/* Active Category Filter Reset Badge (Shown if user filtered by category) */}
          {selectedCategoryFilter !== 'all' && !searchQuery && (
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[11px] font-bold text-slate-600">
                Filtered by: <strong className="text-[#0EA5E0]">{categories.find(c => c.id === selectedCategoryFilter)?.name || selectedCategoryFilter}</strong>
              </span>
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className="text-[11px] font-extrabold text-[#0EA5E0] hover:underline cursor-pointer"
              >
                Clear Filter ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. "Near For You" HORIZONTAL SCROLL CAROUSEL / LIST (Swipe Sideways) */}
      <div className="px-5 pt-1">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Near For You</h4>
              <p className="text-[10px] text-slate-400 font-semibold">Available pros within your area</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-[9px] font-black uppercase text-[#0EA5E0] tracking-wider">
              Swipe ➔
            </span>
          </div>
          <button 
            onClick={() => onNavigateTab?.('bookings')}
            className="text-xs font-bold text-[#0EA5E0] hover:underline transition cursor-pointer"
          >
            My Bookings ➔
          </button>
        </div>

        {/* Smooth Horizontal Carousel List */}
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-5 px-5 snap-x snap-mandatory scroll-smooth">
          {displayedServices.map((service) => {
            if (!service) return null;
            return (
              <div
                key={service.id || Math.random()}
                onClick={() => onSelectService(service)}
                className="relative w-[260px] sm:w-[280px] h-48 rounded-[24px] overflow-hidden shadow-card border border-slate-100 cursor-pointer group active:scale-[0.98] transition-all duration-200 shrink-0 snap-start"
              >
                {/* Cover Image */}
                <img
                  src={service.heroImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"}
                  alt={service.title || "Service"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Rating Badge */}
                <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-extrabold text-slate-900 shadow-sm flex items-center gap-1">
                  <span className="text-amber-400">★</span>
                  <span>{service.rating || '4.9'}</span>
                  <span className="text-slate-400 font-semibold">({service.reviewCount || 'Review'})</span>
                </div>

                {/* Bottom Overlay Card */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-8 pb-3 px-3.5 flex items-end justify-between">
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
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-[#0EA5E0] transition-colors shadow-sm shrink-0">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. EXTENDED SCROLLABLE PROFESSIONAL LAYOUT: Trust, Guarantees & About Section */}
      
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
            <Sparkles className="w-3 3 fill-white" />
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

      {/* Clean Notification Center Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadChange={setUnreadNotifCount}
      />

      {/* Dedicated Location & GPS Geolocation Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCity={locationName}
        onSelectLocation={(loc) => {
          setLocationName(loc);
          onUpdateCity?.(loc);
        }}
      />

    </div>
  );
}

export { CustomerDashboard as HomeScreen };
