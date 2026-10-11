import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  MoreVertical, 
  Star, 
  Eye, 
  Calendar,
  X,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { initialCategories, initialServices } from '../data/seedData';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export function ServiceListScreen({ 
  onBack, 
  onSelectService, 
  onBookService,
  initialCategory = 'All' 
}) {
  const [services, setServices] = useState(initialServices || []);
  const [categories, setCategories] = useState(initialCategories || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'All');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Firestore real-time sync for services & categories if configured
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    let unsubServices = () => {};
    let unsubCategories = () => {};

    try {
      unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setServices(items);
        }
      }, () => {});

      unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCategories(items);
        }
      }, () => {});
    } catch {
      // quiet fallback
    }

    return () => {
      unsubServices();
      unsubCategories();
    };
  }, []);

  // Filter Categories: 'All', 'Cleaning', 'Plumber', 'Repairing', 'Painting', 'Electrician', etc.
  const filterPills = [
    'All',
    'Cleaning',
    'Plumber',
    'Repairing',
    'Electrician',
    'Painting',
    'Carpenter'
  ];

  // Helper matching function for category pills
  const matchesCategory = (service, filter) => {
    if (!filter || filter === 'All') return true;
    const catLower = filter.toLowerCase();
    const serviceCat = (service.categoryName || '').toLowerCase();
    const serviceTitle = (service.title || '').toLowerCase();
    const serviceId = (service.categoryId || '').toLowerCase();

    if (catLower === 'plumber' || catLower === 'plumbing') {
      return serviceCat.includes('plumb') || serviceTitle.includes('plumb') || serviceId.includes('plumb');
    }
    if (catLower === 'cleaning') {
      return serviceCat.includes('clean') || serviceTitle.includes('clean') || serviceId.includes('clean');
    }
    if (catLower === 'repairing' || catLower === 'repair') {
      return serviceCat.includes('repair') || serviceCat.includes('ac') || serviceTitle.includes('repair') || serviceTitle.includes('ac');
    }
    if (catLower === 'electrician' || catLower === 'electrical') {
      return serviceCat.includes('elect') || serviceTitle.includes('elect') || serviceId.includes('elect');
    }
    if (catLower === 'painting') {
      return serviceCat.includes('paint') || serviceTitle.includes('paint') || serviceId.includes('paint');
    }
    if (catLower === 'carpenter') {
      return serviceCat.includes('carp') || serviceTitle.includes('carp') || serviceId.includes('carp');
    }

    return serviceCat.includes(catLower) || serviceTitle.includes(catLower);
  };

  // Filter services by category pill, search query, and drawer filters
  const filteredServices = (services || []).filter(service => {
    if (!service) return false;

    // 1. Category Pill Filter
    if (!matchesCategory(service, activeCategory)) {
      return false;
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (service.title || '').toLowerCase().includes(q);
      const matchCat = (service.categoryName || '').toLowerCase().includes(q);
      const matchBadge = (service.badge || '').toLowerCase().includes(q);
      const matchAbout = (service.about || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchBadge && !matchAbout) {
        return false;
      }
    }

    // 3. Rating & Price filter
    if (minRating > 0 && (service.rating || 0) < minRating) return false;
    if (maxPrice < 1000 && (service.price || 0) > maxPrice) return false;

    return true;
  });

  // Get nice display tag for category badge (e.g. 'Cleaning', 'Plumber', 'Repairing')
  const getDisplayCategoryTag = (service) => {
    const cat = service.categoryName || '';
    if (cat.toLowerCase().includes('clean')) return 'Cleaning';
    if (cat.toLowerCase().includes('plumb')) return 'Plumber';
    if (cat.toLowerCase().includes('ac') || cat.toLowerCase().includes('repair')) return 'Repairing';
    if (cat.toLowerCase().includes('elect')) return 'Electrician';
    if (cat.toLowerCase().includes('paint')) return 'Painting';
    return cat || 'Service';
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-28 text-slate-900 select-none">
      
      {/* 1. Top Bar: Clean header with Back arrow, 'Search Service' title, & options menu icon */}
      <header className="bg-white px-5 pt-4 pb-3 border-b border-slate-100/80 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
          </button>

          <h1 className="text-base font-black text-slate-900 tracking-tight">
            Search Service
          </h1>

          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(prev => !prev)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Dropdown Options Menu */}
            {showOptionsMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-scale-up">
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    setSearchQuery('');
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#0EA5E0] transition"
                >
                  Reset All Filters
                </button>
                <button
                  onClick={() => {
                    setShowFilterDrawer(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#0EA5E0] transition"
                >
                  Price & Rating Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Rounded input bar with 'Search Popular Service...' placeholder & filter icon button */}
        <div className="mt-3.5 flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Popular Service..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#F8FAFC] border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0EA5E0] focus:bg-white focus:ring-2 focus:ring-sky-100 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-300 transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Icon Button */}
          <button
            onClick={() => setShowFilterDrawer(prev => !prev)}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
              minRating > 0 || maxPrice < 1000 || showFilterDrawer
                ? 'bg-[#0EA5E0] text-white border-[#0EA5E0]'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
            }`}
            title="Filter options"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* 3. Category Filter Chips (Horizontally scrollable filter pill buttons right below search) */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1 pt-0.5">
          {filterPills.map((pill) => {
            const isActive = activeCategory === pill;
            return (
              <button
                key={pill}
                onClick={() => setActiveCategory(pill)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#0EA5E0] text-white shadow-sm shadow-sky-400/30'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </header>

      {/* Filter Drawer / Accordion if active */}
      {showFilterDrawer && (
        <div className="bg-white border-b border-slate-200/80 px-5 py-3 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-800">Quick Refine</span>
            <button
              onClick={() => {
                setMinRating(0);
                setMaxPrice(1000);
              }}
              className="text-[11px] font-bold text-[#0EA5E0] hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <span>Rating:</span>
              {[0, 4.5, 4.8].map(r => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition ${
                    minRating === r ? 'bg-sky-50 border-[#0EA5E0] text-[#0EA5E0]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {r === 0 ? 'Any' : `★ ${r}+`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span>Max:</span>
              {[1000, 500, 350].map(p => (
                <button
                  key={p}
                  onClick={() => setMaxPrice(p)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition ${
                    maxPrice === p ? 'bg-sky-50 border-[#0EA5E0] text-[#0EA5E0]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {p === 1000 ? 'Any' : `≤ ₹${p}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Service Card Design (List View) */}
      <div className="px-5 pt-3.5 space-y-3.5">
        
        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-0.5">
          <span>
            Showing <strong className="text-slate-800">{filteredServices.length}</strong> available services
          </span>
          {activeCategory !== 'All' && (
            <span className="text-[#0EA5E0] font-bold">Category: {activeCategory}</span>
          )}
        </div>

        {/* Services List matching reference image right screen */}
        {filteredServices.map((service) => {
          const categoryTag = getDisplayCategoryTag(service);
          
          return (
            <div
              key={service.id}
              className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-100/90 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Card Top Row: Left Thumbnail, Middle Content, Top Right Tag */}
              <div className="flex items-start gap-3">
                
                {/* Left Side: Thumbnail image of the service worker/task */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200/60 shadow-2xs">
                  <img
                    src={service.heroImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80"}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Middle: Service Title, Star rating with review count, Hourly rate/price */}
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug truncate">
                    {service.title}
                  </h3>

                  {/* Star rating with review count: e.g., ★ 4.8 (250 reviews) */}
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-extrabold text-slate-800">
                      {service.rating || '4.8'}
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">
                      ({service.reviewCount || 250} reviews)
                    </span>
                  </div>

                  {/* Hourly rate/price: e.g., ₹800/hour or ₹300/hour */}
                  <div className="mt-1">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      ₹{service.price || 80}/hour
                    </span>
                  </div>
                </div>

                {/* Top Right Tag: Light background pill tag indicating the category (e.g., 'Cleaning') */}
                <div className="shrink-0">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-black tracking-tight">
                    {categoryTag}
                  </span>
                </div>
              </div>

              {/* Bottom Action Buttons: Two side-by-side action buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-3.5 pt-3 border-t border-slate-100/90">
                
                {/* Outlined/light button for 'View Details' (with an eye icon) */}
                <button
                  onClick={() => onSelectService?.(service)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600 stroke-[2.2]" />
                  <span>View Details</span>
                </button>

                {/* Solid primary blue button for 'Book Now' (with a calendar/booking icon) */}
                <button
                  onClick={() => onBookService?.(service)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-[#0EA5E0] hover:bg-[#0284C7] text-white text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-sm shadow-sky-400/25"
                >
                  <Calendar className="w-3.5 h-3.5 text-white stroke-[2.4]" />
                  <span>Book Now</span>
                </button>
              </div>

            </div>
          );
        })}

        {/* Empty State when no services match */}
        {filteredServices.length === 0 && (
          <div className="py-14 text-center bg-white rounded-3xl border border-slate-100 p-6">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-[#0EA5E0] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-black text-slate-900">No Services Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              We couldn't find any services matching "{searchQuery}" in category "{activeCategory}".
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
                setMinRating(0);
                setMaxPrice(1000);
              }}
              className="mt-4 px-4 py-2 rounded-full bg-[#0EA5E0] text-white text-xs font-black shadow-xs cursor-pointer"
            >
              Show All Services
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default ServiceListScreen;
