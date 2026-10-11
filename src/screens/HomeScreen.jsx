import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Bell, 
  ChevronDown, 
  Star, 
  ArrowRight
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { initialCategories, initialBanners, initialServices } from '../data/seedData';

export function HomeScreen({ 
  onSelectCategory, 
  onSelectService, 
  onNavigateTab,
  currentCity,
  onChangeCity,
  onOpenNotifications,
  onOpenSearch
}) {
  const [categories, setCategories] = useState(initialCategories || []);
  const [banners, setBanners] = useState(initialBanners || []);
  const [services, setServices] = useState(initialServices || []);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('cat_plumbing');

  // Firestore Real-time Sync (quiet, resilient)
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
    <div className="w-full min-h-screen bg-white pb-24 text-slate-900 select-none">
      
      {/* 1. Header (Location & Buttons) */}
      <div className="px-5 pt-2 pb-3 flex items-center justify-between">
        <div 
          onClick={onChangeCity}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-sky-50 text-[#0EA5E0] flex items-center justify-center shrink-0 border border-sky-100">
            <MapPin className="w-4 h-4 fill-[#0EA5E0]" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 leading-tight">
              <span>My Location</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 transition" />
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight mt-0.5">
              {currentCity || "Celina, Delaware"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenSearch}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4 stroke-[2]" />
          </button>
          <button 
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            <span className="w-2 h-2 rounded-full bg-[#0EA5E0] absolute top-2 right-2 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* 2. Auto-sliding Promotional Banner Carousel */}
      <div className="px-5 pt-1 pb-3">
        <div className="relative w-full rounded-[24px] bg-gradient-to-r from-[#2B8FD8] to-[#6FD0EE] p-4 overflow-hidden shadow-lg shadow-sky-400/20 text-white min-h-[155px] flex flex-col justify-between">
          {/* Thumbs-up worker image on right */}
          <div className="absolute right-0 bottom-0 w-[48%] h-full pointer-events-none flex items-end justify-end">
            <img
              src={activeBanner.image || "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=500&q=80"}
              alt="Worker"
              className="h-full object-cover object-top scale-110"
            />
          </div>

          <div className="relative z-10 max-w-[58%]">
            <h3 className="text-lg font-extrabold tracking-tight leading-tight">
              {activeBanner.title || "Book Trusted Services"}
            </h3>
            <p className="text-[10px] text-white/85 font-medium mt-1 leading-snug">
              {activeBanner.subtitle || "Get quick access to home services your location."}
            </p>
          </div>

          {/* Glassmorphic Inner Card */}
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

      {/* 3. "Select Category" Horizontal Scroll */}
      <div className="pt-1 pb-3">
        <div className="px-5 mb-2.5 flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-slate-900">Select Category</h4>
          {selectedCategoryFilter !== 'all' && (
            <button 
              onClick={() => setSelectedCategoryFilter('all')}
              className="text-[11px] font-bold text-[#0EA5E0] hover:underline"
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

      {/* 4. "Near For You" with "See all" */}
      <div className="px-5 pt-1">
        <div className="mb-2.5 flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-slate-900">Near For You</h4>
          <button 
            onClick={() => onNavigateTab?.('bookings')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            See all
          </button>
        </div>

        {/* Large Image Cards Grid */}
        <div className="flex flex-col gap-3.5">
          {displayedServices.map((service) => {
            if (!service) return null;
            return (
              <div
                key={service.id || Math.random()}
                onClick={() => onSelectService(service)}
                className="relative h-44 rounded-[22px] overflow-hidden shadow-sm border border-slate-100 cursor-pointer group active:scale-[0.99] transition-all duration-200"
              >
                {/* Cover Image */}
                <img
                  src={service.heroImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"}
                  alt={service.title || "Service"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* ★ 4.9 (Review) badge top right */}
                <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-extrabold text-slate-900 shadow-sm flex items-center gap-1">
                  <span className="text-amber-400">★</span>
                  <span>{service.rating || '4.9'}</span>
                  <span className="text-slate-400 font-semibold">({service.reviewCount || 'Review'})</span>
                </div>

                {/* Bottom text overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-8 pb-3 px-3.5 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">
                      {service.title || "Home Service"}
                    </p>
                    <p className="text-[11px] font-semibold text-sky-300">
                      ₹{service.price || 300}/hour
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-[#0EA5E0] transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
