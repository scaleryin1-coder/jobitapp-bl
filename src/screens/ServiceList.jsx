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
  Clock,
  MapPin
} from 'lucide-react';
import { initialCategories, initialServices } from '../data/seedData';
import { ALL_MAIN_CATEGORIES, isPortfolioCategory } from '../data/categoriesData';
import { subscribeServices, isCategoryAvailableInLocation } from '../data/bookingService';
import { matchesStrictPrefix, highlightPrefix, getMatchedSnippet } from '../utils/searchUtils';

export function ServiceListScreen({ 
  onBack, 
  onSelectService, 
  onBookService,
  initialCategory = 'All',
  initialSearch = '',
  currentCity = 'Melattur, Kerala',
  workers = []
}) {
  const [services, setServices] = useState(initialServices || []);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'All');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const cleanCity = (currentCity || 'your area').split(',')[0].trim();
  const isCategoryLive = activeCategory === 'All' || isCategoryAvailableInLocation(activeCategory, currentCity, workers);

  // Sync initialCategory & initialSearch if changed from parent
  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Dynamic real-time sync for services across local events & Firestore
  useEffect(() => {
    const unsubServices = subscribeServices((items) => {
      if (items && Array.isArray(items)) {
        setServices(items);
      }
    });

    return () => {
      unsubServices();
    };
  }, []);

  // Filter Pills ordered exactly as in reference image (image_6.png)
  const filterPills = [
    'All',
    'Coconut Tree',
    'Cleaning',
    'Plumber',
    'Repairing',
    'Electrician',
    'Painting',
    'Carpenter',
    'Construction',
    'Welding',
    'Aluminium',
    'Garden',
    'Pest Control',
    'Bike Service',
    'Car Mechanic',
    'Moving & Labour',
    'Security',
    'Electronics',
    'Laundry',
    'Home Support',
    'Beauty',
    'Mehndi Artist',
    'Water Tank'
  ];

  // Helper matching function for category pills
  const matchesCategory = (service, filter) => {
    if (!filter || filter === 'All') return true;
    const catLower = filter.toLowerCase().trim();
    const serviceCat = (service.categoryName || '').toLowerCase().trim();
    const serviceTitle = (service.title || '').toLowerCase().trim();
    const serviceId = (service.categoryId || '').toLowerCase().trim();

    if ((catLower.includes('coconut') || catLower.includes('തെങ്ങ്') || catLower.includes('tree')) && (serviceCat.includes('coconut') || serviceCat.includes('തെങ്ങ്') || serviceTitle.includes('coconut') || serviceTitle.includes('തെങ്ങ്'))) return true;
    if (catLower.includes('clean') && (serviceCat.includes('clean') || serviceTitle.includes('clean'))) return true;
    if (catLower.includes('plumb') && (serviceCat.includes('plumb') || serviceTitle.includes('plumb'))) return true;
    if ((catLower.includes('repair') || catLower.includes('ac')) && (serviceCat.includes('ac') || serviceCat.includes('repair') || serviceTitle.includes('ac') || serviceTitle.includes('repair'))) return true;
    if (catLower.includes('elect') && (serviceCat.includes('elect') || serviceTitle.includes('elect'))) return true;
    if (catLower.includes('paint') && (serviceCat.includes('paint') || serviceTitle.includes('paint'))) return true;
    if (catLower.includes('carp') && (serviceCat.includes('carp') || serviceTitle.includes('carp'))) return true;
    if (catLower.includes('construct') && (serviceCat.includes('construct') || serviceTitle.includes('construct'))) return true;
    if (catLower.includes('weld') && (serviceCat.includes('weld') || serviceTitle.includes('weld'))) return true;
    if (catLower.includes('alumin') && (serviceCat.includes('alumin') || serviceTitle.includes('alumin'))) return true;
    if (catLower.includes('garden') && (serviceCat.includes('garden') || serviceTitle.includes('garden'))) return true;
    if (catLower.includes('pest') && (serviceCat.includes('pest') || serviceTitle.includes('pest'))) return true;
    if (catLower.includes('bike') && (serviceCat.includes('bike') || serviceTitle.includes('bike'))) return true;
    if (catLower.includes('car') && !catLower.includes('carp') && (serviceCat.includes('car') || serviceTitle.includes('car'))) return true;
    if ((catLower.includes('mov') || catLower.includes('labour')) && (serviceCat.includes('mov') || serviceCat.includes('labour') || serviceTitle.includes('mov'))) return true;
    if ((catLower.includes('secur') || catLower.includes('smart')) && (serviceCat.includes('secur') || serviceCat.includes('smart'))) return true;
    if (catLower.includes('electron') && (serviceCat.includes('electron') || serviceTitle.includes('electron'))) return true;
    if (catLower.includes('laund') && (serviceCat.includes('laund') || serviceTitle.includes('laund'))) return true;
    if (catLower.includes('home support') && (serviceCat.includes('support') || serviceCat.includes('clean'))) return true;
    if (catLower.includes('beaut') && (serviceCat.includes('beaut') || serviceTitle.includes('beaut'))) return true;
    if ((catLower.includes('mehndi') || catLower.includes('mehandhi') || catLower.includes('henna')) && 
        (serviceCat.includes('mehndi') || serviceCat.includes('mehandhi') || serviceCat.includes('henna') || 
         serviceTitle.includes('mehndi') || serviceTitle.includes('mehandhi') || serviceTitle.includes('henna') ||
         serviceId.includes('mehndi') || serviceId.includes('mehandhi'))) return true;
    if (catLower.includes('tank') && (serviceCat.includes('tank') || serviceTitle.includes('tank'))) return true;

    return (
      serviceCat === catLower ||
      serviceCat.includes(catLower) ||
      catLower.includes(serviceCat) ||
      serviceTitle.includes(catLower) ||
      serviceId.includes(catLower)
    );
  };

  // Filter services by category pill, search query, and quick rating/price
  const filteredServices = (services || []).filter(service => {
    if (!service) return false;

    // 1. Category Pill Filter
    if (!matchesCategory(service, activeCategory)) {
      return false;
    }

    // 2. Search Query (Strict Prefix / Exact Start Match)
    if (searchQuery.trim()) {
      if (!matchesStrictPrefix(service, searchQuery)) {
        return false;
      }
    }

    // 3. Rating & Price filter
    if (minRating > 0 && (service.rating || 0) < minRating) return false;
    if (maxPrice < 1000 && (service.price || 0) > maxPrice) return false;

    return true;
  });

  // Category badge tag colors and labels matching image_6.png exactly
  const getCategoryBadgeInfo = (service) => {
    const cat = service.categoryName || '';
    const title = service.title || '';
    const combined = (cat + ' ' + title).toLowerCase();

    // Coconut Tree Climbing: natural light green badge with emerald text
    if (combined.includes('coconut') || combined.includes('തെങ്ങ്') || combined.includes('palm')) {
      return { tag: 'Coconut Tree', className: 'bg-[#DCFCE7] text-[#059669]' };
    }
    // Plumber: light cyan badge with blue text
    if (combined.includes('plumb')) {
      return { tag: 'Plumber', className: 'bg-[#E0F7FA] text-[#00A3E0]' };
    }
    // AC / Repairing: light amber badge with amber text
    if (combined.includes('repair') || combined.includes('ac')) {
      return { tag: 'Repairing', className: 'bg-[#FEF3C7] text-[#D97706]' };
    }
    // Cleaning: light green badge with emerald text
    if (combined.includes('clean')) {
      return { tag: 'Cleaning', className: 'bg-[#D1FAE5] text-[#059669]' };
    }
    // Electrician: light blue badge with blue text
    if (combined.includes('elect')) {
      return { tag: 'Electrician', className: 'bg-[#DBEAFE] text-[#2563EB]' };
    }
    // Painting: soft lavender badge with purple text
    if (combined.includes('paint')) {
      return { tag: 'Painting', className: 'bg-[#F3E8FF] text-[#9333EA]' };
    }
    // Carpenter: soft pink badge with rose text
    if (combined.includes('carp')) {
      return { tag: 'Carpenter', className: 'bg-[#FEE2E2] text-[#DC2626]' };
    }
    // Electronics
    if (combined.includes('electron')) {
      return { tag: 'Electronics', className: 'bg-[#E0F2FE] text-[#0284C7]' };
    }
    // Default fallback
    return { tag: cat || 'Service', className: 'bg-slate-100 text-slate-700' };
  };

  // Curated, high-resolution Unsplash stock photos of European technicians in neat blue/navy uniforms
  const TECHNICIAN_UNIFORM_THUMBNAILS = {
    plumber: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80', // European plumber in blue uniform with wrench fixing pipes
    ac: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80', // European HVAC specialist in neat blue uniform servicing AC unit
    cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80', // Professional cleaner in crisp navy uniform
    electrician: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80', // Electrician in navy uniform inspecting circuit breaker board
    painting: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80', // Craftsman painter in blue uniform with roller
    carpenter: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80', // Carpenter in dark blue uniform measuring and assembling woodwork
    construction: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80', // Construction engineer in navy workwear and hardhat on site
    welding: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80', // Metal fabricator in blue protective jacket welding
    aluminium: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', // Glazing and window technician in blue uniform
    garden: 'https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&w=600&q=80', // European gardener in blue work overalls working in outdoor garden space
    pest: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80', // Pest control technician in blue protective workwear
    bike: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80', // Two-wheeler mechanic in navy uniform
    car: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80', // Automotive technician in neat navy uniform inspecting car engine
    driver: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80', // Professional chauffeur/driver wearing neat dark blue uniform next to modern car
    moving: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=600&q=80', // Shifting and logistics team in blue uniform shirts
    security: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80', // Security automation technician in blue uniform
    electronics: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', // Electronics specialist in navy workwear troubleshooting appliance
    laundry: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80', // Laundry professional in neat navy uniform
    homesupport: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80', // Domestic support professional in neat blue uniform
    watertank: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80', // Maintenance technician in navy utility uniform
    beauty: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80', // Professional salon aesthetician
    mehndi: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80' // Traditional henna artist
  };

  const getTechnicianServiceThumbnail = (service) => {
    if (!service) return TECHNICIAN_UNIFORM_THUMBNAILS.plumber;

    // Manual direct Image URL explicitly set by Admin takes immediate precedence
    const manualImage = service.heroImage || service.imageUrl || service.image;
    if (manualImage && typeof manualImage === 'string' && manualImage.trim() !== '') {
      return manualImage;
    }
    
    const text = `${service.categoryId || ''} ${service.categoryName || ''} ${service.title || ''}`.toLowerCase();
    
    if (text.includes('plumb')) return TECHNICIAN_UNIFORM_THUMBNAILS.plumber;
    if (text.includes('ac') || text.includes('air') || text.includes('hvac') || text.includes('cool')) return TECHNICIAN_UNIFORM_THUMBNAILS.ac;
    if (text.includes('clean')) return TECHNICIAN_UNIFORM_THUMBNAILS.cleaning;
    if (text.includes('elect')) return TECHNICIAN_UNIFORM_THUMBNAILS.electrician;
    if (text.includes('paint')) return TECHNICIAN_UNIFORM_THUMBNAILS.painting;
    if (text.includes('carp')) return TECHNICIAN_UNIFORM_THUMBNAILS.carpenter;
    if (text.includes('construct') || text.includes('mason') || text.includes('civil')) return TECHNICIAN_UNIFORM_THUMBNAILS.construction;
    if (text.includes('weld')) return TECHNICIAN_UNIFORM_THUMBNAILS.welding;
    if (text.includes('alumin') || text.includes('glass') || text.includes('window')) return TECHNICIAN_UNIFORM_THUMBNAILS.aluminium;
    if (text.includes('garden') || text.includes('lawn')) return TECHNICIAN_UNIFORM_THUMBNAILS.garden;
    if (text.includes('pest') || text.includes('termite')) return TECHNICIAN_UNIFORM_THUMBNAILS.pest;
    if (text.includes('bike') || text.includes('motor')) return TECHNICIAN_UNIFORM_THUMBNAILS.bike;
    if (text.includes('driver') || text.includes('chauffeur')) return TECHNICIAN_UNIFORM_THUMBNAILS.driver;
    if (text.includes('car') || text.includes('auto')) return TECHNICIAN_UNIFORM_THUMBNAILS.car;
    if (text.includes('mov') || text.includes('shift') || text.includes('lift') || text.includes('labour')) return TECHNICIAN_UNIFORM_THUMBNAILS.moving;
    if (text.includes('secur') || text.includes('cctv') || text.includes('smart') || text.includes('lock')) return TECHNICIAN_UNIFORM_THUMBNAILS.security;
    if (text.includes('electron') || text.includes('appliance') || text.includes('tv')) return TECHNICIAN_UNIFORM_THUMBNAILS.electronics;
    if (text.includes('laund') || text.includes('wash') || text.includes('iron')) return TECHNICIAN_UNIFORM_THUMBNAILS.laundry;
    if (text.includes('support') || text.includes('elder') || text.includes('help')) return TECHNICIAN_UNIFORM_THUMBNAILS.homesupport;
    if (text.includes('tank') || text.includes('waste') || text.includes('sump')) return TECHNICIAN_UNIFORM_THUMBNAILS.watertank;
    if (text.includes('beaut') || text.includes('salon') || text.includes('spa')) return TECHNICIAN_UNIFORM_THUMBNAILS.beauty;
    if (text.includes('mehndi') || text.includes('henna')) return TECHNICIAN_UNIFORM_THUMBNAILS.mehndi;
    if (text.includes('coconut') || text.includes('തെങ്ങ്') || text.includes('tree') || text.includes('palm')) return '/assets/images/coconut_climber.jpg';

    return TECHNICIAN_UNIFORM_THUMBNAILS.plumber;
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-28 text-slate-900 select-none">
      
      {/* 1. Header: Back arrow, "Search Service" title, & More options menu icon */}
      <header 
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
        className="bg-white px-5 pb-3 border-b border-slate-100/80 sticky top-0 z-30 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
          </button>

          <h1 className="text-base font-extrabold text-[#111827] tracking-tight">
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
                    setMinRating(0);
                    setMaxPrice(1000);
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

        {/* 2. Search Input bar with "Search Popular Service..." placeholder & filter button */}
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
                className="absolute right-3 top-2.5 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-300 transition text-[10px]"
                title="Clear search"
              >
                ✕
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

        {/* 3. Horizontal Category Filter Chips matching image_6.png */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1 pt-0.5">
          {filterPills.map((pill) => {
            const isActive = activeCategory.toLowerCase() === pill.toLowerCase();
            return (
              <button
                key={pill}
                onClick={() => setActiveCategory(pill)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#00A3E0] text-white shadow-sm shadow-sky-400/30'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </header>

      {/* Quick Filter Drawer (Price & Rating only, strictly NO category selection blocks) */}
      {showFilterDrawer && (
        <div className="bg-white border-b border-slate-200/80 px-5 py-3 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-800">Quick Refine</span>
            <button
              onClick={() => {
                setMinRating(0);
                setMaxPrice(1000);
              }}
              className="text-[11px] font-bold text-[#00A3E0] hover:underline cursor-pointer"
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    minRating === r ? 'bg-sky-50 border-[#00A3E0] text-[#00A3E0]' : 'border-slate-200 text-slate-600'
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    maxPrice === p ? 'bg-sky-50 border-[#00A3E0] text-[#00A3E0]' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {p === 1000 ? 'Any' : `≤ ₹${p}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Results Section: Results Counter & Individual Service Cards */}
      <div className="px-5 pt-3.5 space-y-3.5">
        
        {/* Results Counter: "Showing X available services" */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-0.5">
          <span>
            Showing <strong className="text-[#111827] font-black">{filteredServices.length}</strong> available services
          </span>
          {activeCategory !== 'All' && (
            <button
              onClick={() => setActiveCategory('All')}
              className="text-[#00A3E0] font-bold hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Category-Level Availability Banner for selected location */}
        {!isCategoryLive && activeCategory !== 'All' && (
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-3xl p-4 text-center shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase mb-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Coming Soon to {cleanCity}</span>
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Coming Soon to Your Area!
            </h3>
            <p className="text-xs text-slate-600 font-semibold mt-1 max-w-xs mx-auto leading-relaxed">
              We are onboarding top local professionals in <strong className="text-slate-900">{cleanCity}</strong> soon.
            </p>
          </div>
        )}

        {/* Individual Service Cards strictly matching image_6.png */}
        {filteredServices.map((service) => {
          const badgeInfo = getCategoryBadgeInfo(service);
          const isServiceLive = isCategoryAvailableInLocation(service, currentCity, workers);
          
          return (
            <div
              key={service.id}
              className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200"
            >
              {/* Card Top Row: Left Thumbnail, Middle Content, Top Right Tag */}
              <div className="flex items-start gap-3">
                
                {/* Thumbnail image on the left strictly constrained with proper object-fit: cover and border-radius */}
                <div 
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200/60 shadow-2xs relative"
                  style={{ width: '4.75rem', height: '4.75rem', minWidth: '4.75rem', minHeight: '4.75rem', borderRadius: '1rem' }}
                >
                  <img
                    src={getTechnicianServiceThumbnail(service)}
                    alt={service.title}
                    className="w-full h-full object-cover block rounded-2xl"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' }}
                    loading="lazy"
                  />
                </div>

                {/* Middle: Service Title, Star rating with review count, Hourly rate/price */}
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#111827] leading-snug truncate">
                    {searchQuery.trim() ? highlightPrefix(service.title, searchQuery) : service.title}
                  </h3>
                  {searchQuery.trim() && (() => {
                    const snippet = getMatchedSnippet(service, searchQuery);
                    if (!snippet) return null;
                    return (
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate flex items-center gap-1">
                        <span className="text-[#00A3E0] font-black">•</span>
                        <span>Matched: {highlightPrefix(snippet.label || snippet.text, searchQuery)}</span>
                      </div>
                    );
                  })()}

                  {/* Star rating with review count: e.g. ★ 4.8 (180 reviews) */}
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-extrabold text-[#111827]">
                      {service.rating || '4.8'}
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">
                      ({service.reviewCount || 180} reviews)
                    </span>
                  </div>

                  {/* Doorstep Inspection & Service */}
                  <div className="mt-1.5 flex flex-col">
                    <span className="text-xs font-black text-[#00A3E0] tracking-tight">
                      Doorstep Service
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 leading-tight">
                      Verified Professional Dispatch
                    </span>
                  </div>
                </div>

                {/* Top Right: Category tag pill */}
                <div className="shrink-0">
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight ${badgeInfo.className}`}>
                    {badgeInfo.tag}
                  </span>
                </div>
              </div>

              {/* Bottom Action Buttons: Two distinct buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-3.5 pt-3 border-t border-slate-100/90">
                
                {/* Outlined button for 'View Details' (with eye icon) */}
                <button
                  onClick={() => onSelectService?.(service)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 text-[#111827] text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-700 stroke-[2.2]" />
                  <span>View Details</span>
                </button>

                {/* Solid blue style button for 'Book Now' / 'Select Pro' or 'Notify When Live' */}
                <button
                  onClick={() => onBookService?.(service)}
                  className={`w-full py-2.5 px-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-sm ${
                    isServiceLive
                      ? 'bg-[#00A3E0] hover:bg-[#0284C7] shadow-sky-400/25'
                      : 'bg-amber-500 hover:bg-amber-600 shadow-amber-400/25'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-white stroke-[2.4]" />
                  <span>
                    {!isServiceLive 
                      ? 'Notify When Live' 
                      : (isPortfolioCategory(service) ? 'Select Pro ➔' : 'Book Now')}
                  </span>
                </button>
              </div>

            </div>
          );
        })}

        {/* Empty State when no services match */}
        {filteredServices.length === 0 && (
          <div className="py-14 text-center bg-white rounded-3xl border border-slate-100 p-6">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-[#00A3E0] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-black text-[#111827]">No Services Found</h4>
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
              className="mt-4 px-4 py-2 rounded-full bg-[#00A3E0] text-white text-xs font-bold shadow-xs cursor-pointer hover:bg-[#0284C7] transition"
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
