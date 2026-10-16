import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { initialCategories, initialBanners, initialServices } from '../data/seedData';
import { subscribeServices, subscribeCategories, subscribeWorkers, getLocalCategories } from '../data/bookingService';
import { useAuth } from '../context/AuthContext';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSearchSection } from '../components/home/HomeSearchSection';
import { PromotionalHeroBanner } from '../components/home/PromotionalHeroBanner';
import { MiddleBannerCarousel } from '../components/home/MiddleBannerCarousel';
import { CategoryRow } from '../components/home/CategoryRow';
import { PopularServiceSection } from '../components/home/PopularServiceSection';
import { AllCategoriesModal } from '../components/home/AllCategoriesModal';
import { FilterModal } from '../components/home/FilterModal';
import { DailyGigsSection } from '../components/gigs/DailyGigsSection';
import { FeatureHighlightsBar } from '../components/home/FeatureHighlightsBar';
import { ALL_MAIN_CATEGORIES } from '../data/categoriesData';
import { NotificationModal } from './NotificationModal';
import { LocationPickerModal } from './LocationPickerModal';
import { matchesStrictPrefix } from '../utils/searchUtils';

export function CustomerDashboard({ 
  onSelectCategory, 
  onSelectService, 
  onBookService,
  onNavigateTab,
  currentCity,
  onUpdateCity,
  onOpenSearch,
  onOpenFilter,
  onOpenProfileDrawer,
  onOpenWorkerOnboarding
}) {
  const { currentUser } = useAuth();

  // Existing Data State (guarantees all catalog categories load consistently from database/state)
  const [categories, setCategories] = useState(() => getLocalCategories());
  const [banners, setBanners] = useState(initialBanners || []);
  const [services, setServices] = useState(initialServices || []);
  const [workers, setWorkers] = useState([]);

  // Location State
  const [locationName, setLocationName] = useState(() => {
    return localStorage.getItem('jobit_user_location') || currentCity || 'Melattur, Kerala';
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Notification State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(2);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Categories Modal State (Shows complete list of all 20 categories)
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);

  // Filter Menu State (All 20 Categories, Rating & Price Filters)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [minRatingFilter, setMinRatingFilter] = useState(0);
  const [maxPriceFilter, setMaxPriceFilter] = useState(2000);

  // Sync prop changes for currentCity
  useEffect(() => {
    if (currentCity) {
      setLocationName(currentCity);
    }
  }, [currentCity]);

  // Reactive real-time sync for categories, services & banners
  useEffect(() => {
    const unsubServices = subscribeServices((items) => {
      if (items && Array.isArray(items)) {
        setServices(items);
      }
    });

    const unsubCategories = subscribeCategories((items) => {
      if (items && Array.isArray(items)) {
        setCategories(items);
      }
    });

    const unsubWorkers = subscribeWorkers((items) => {
      if (items && Array.isArray(items)) {
        setWorkers(items);
      }
    });

    let unsubBanners = () => {};
    if (isFirebaseConfigured && db) {
      try {
        unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const active = items.filter(b => b?.active !== false).sort((a, b) => (a?.order || 0) - (b?.order || 0));
            if (active.length > 0) setBanners(active);
          }
        }, () => {});
      } catch {}
    }

    return () => {
      unsubServices();
      unsubCategories();
      unsubWorkers();
      unsubBanners();
    };
  }, []);

  // Filter services by search query (strict prefix match) and category/rating/price
  const searchResults = (services || []).filter(s => {
    if (!s) return false;

    // Strict Prefix-Based Matching when user types
    if (searchQuery.trim()) {
      if (!matchesStrictPrefix(s, searchQuery)) return false;
    } else if (selectedCategoryFilter === 'All' && minRatingFilter === 0 && maxPriceFilter === 2000) {
      // No active search and no custom filter -> no dropdown list
      return false;
    }

    // Category filter matching all 20 categories
    if (selectedCategoryFilter !== 'All') {
      const catLower = selectedCategoryFilter.toLowerCase().trim();
      const sCat = (s.categoryName || '').toLowerCase().trim();
      const sTitle = (s.title || '').toLowerCase().trim();
      const sId = (s.categoryId || '').toLowerCase().trim();

      const matchedCat = (
        sCat === catLower ||
        sCat.includes(catLower) ||
        catLower.includes(sCat) ||
        sTitle.includes(catLower) ||
        sId.includes(catLower) ||
        (catLower.includes('ac') && (sCat.includes('ac') || sTitle.includes('ac'))) ||
        (catLower.includes('plumb') && (sCat.includes('plumb') || sTitle.includes('plumb'))) ||
        (catLower.includes('elect') && (sCat.includes('elect') || sTitle.includes('elect'))) ||
        (catLower.includes('carp') && (sCat.includes('carp') || sTitle.includes('carp'))) ||
        (catLower.includes('paint') && (sCat.includes('paint') || sTitle.includes('paint'))) ||
        (catLower.includes('construct') && (sCat.includes('construct') || sTitle.includes('construct') || sTitle.includes('mason'))) ||
        (catLower.includes('weld') && (sCat.includes('weld') || sTitle.includes('weld'))) ||
        (catLower.includes('alumin') && (sCat.includes('alumin') || sTitle.includes('fabricat') || sTitle.includes('window'))) ||
        (catLower.includes('garden') && (sCat.includes('garden') || sTitle.includes('garden') || sTitle.includes('lawn'))) ||
        (catLower.includes('pest') && (sCat.includes('pest') || sTitle.includes('pest') || sTitle.includes('termite'))) ||
        (catLower.includes('bike') && (sCat.includes('bike') || sTitle.includes('bike') || sTitle.includes('wheeler'))) ||
        (catLower.includes('car') && (sCat.includes('car') || sTitle.includes('car') || sTitle.includes('mechanic'))) ||
        (catLower.includes('moving') && (sCat.includes('moving') || sTitle.includes('shift') || sTitle.includes('labour'))) ||
        (catLower.includes('secur') && (sCat.includes('secur') || sTitle.includes('cctv') || sTitle.includes('lock') || sTitle.includes('smart'))) ||
        (catLower.includes('electron') && (sCat.includes('electron') || sTitle.includes('tv') || sTitle.includes('appliance'))) ||
        (catLower.includes('laund') && (sCat.includes('laund') || sTitle.includes('iron') || sTitle.includes('wash'))) ||
        (catLower.includes('support') && (sCat.includes('support') || sCat.includes('clean') || sTitle.includes('domestic') || sTitle.includes('elderly'))) ||
        (catLower.includes('beauty') && (sCat.includes('beauty') || sTitle.includes('salon') || sTitle.includes('spa'))) ||
        (catLower.includes('mehndi') && (sCat.includes('mehndi') || sTitle.includes('henna') || sTitle.includes('mehndi'))) ||
        (catLower.includes('tank') && (sCat.includes('tank') || sTitle.includes('tank') || sTitle.includes('water'))) ||
        ((catLower.includes('coconut') || catLower.includes('തെങ്ങ്') || catLower.includes('tree')) && (sCat.includes('coconut') || sCat.includes('തെങ്ങ്') || sTitle.includes('coconut') || sTitle.includes('തെങ്ങ്')))
      );

      if (!matchedCat) return false;
    }

    // Rating filter
    if (minRatingFilter > 0 && (s.rating || 0) < minRatingFilter) {
      return false;
    }

    // Price filter
    if (maxPriceFilter < 2000 && (s.price || 0) > maxPriceFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#E9F8FD] via-[#F4FAFD] to-[#FFFFFF] pb-24 text-slate-900 select-none">
      
      {/* 1. Header / User Info */}
      <HomeHeader
        currentUser={currentUser}
        locationName={locationName}
        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenProfileDrawer={onOpenProfileDrawer}
        unreadNotifCount={unreadNotifCount}
      />

      {/* 2. Main Title + Search */}
      <HomeSearchSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        onOpenSearch={(q) => onOpenSearch?.(q || searchQuery)}
        onOpenFilter={() => (onOpenFilter ? onOpenFilter(selectedCategoryFilter) : onOpenSearch?.(searchQuery))}
        activeCategoryFilter={selectedCategoryFilter}
        onClearFilter={() => {
          setSelectedCategoryFilter('All');
          setMinRatingFilter(0);
          setMaxPriceFilter(2000);
        }}
        searchResults={searchResults}
        services={services}
        categories={categories}
        onSelectService={(serv) => onSelectService?.(serv)}
        onBookService={(serv) => onBookService?.(serv)}
      />

      {/* Section 1: Top Hero Section - Flat ₹99 Promotional Banner */}
      <PromotionalHeroBanner
        onBookNow={() => {
          const featured = (services && services.length > 0) ? services[0] : {
            id: 'serv_general_inspection',
            title: 'General Inspection & Service Booking',
            categoryName: 'Home Inspection',
            price: 650,
            subCategories: ['Complete Home Diagnostic & Inspection', 'Electrical & Plumbing Checkup', 'AC & Appliance Inspection']
          };
          onBookService?.(featured);
        }}
        onExploreServices={() => onOpenSearch?.()}
      />

      {/* Section 2: Service Categories Grid / Icons */}
      <CategoryRow
        categories={categories}
        currentLocation={locationName}
        workers={workers}
        onSelectCategory={(cat, isLive) => onSelectCategory?.(cat, isLive)}
        onOpenAll={() => setIsAllCategoriesOpen(true)}
      />

      {/* Section 3 (Middle Banner): Auto-scroll carousel (Slide 1: AC Service, Slide 2: Coconut Tree Climbing) */}
      <MiddleBannerCarousel
        services={services}
        currentLocation={locationName}
        workers={workers}
        onSelectService={(serv) => onSelectService?.(serv)}
        onBookService={(serv) => onBookService?.(serv)}
      />

      {/* Section 4: Popular Services / Top Rated Technicians list */}
      <PopularServiceSection
        services={services}
        currentLocation={locationName}
        workers={workers}
        onSelectService={(serv) => onSelectService?.(serv)}
        onBookService={(serv) => onBookService?.(serv)}
        onOpenAll={() => onOpenSearch?.()}
      />

      {/* Section 5: Urgent Daily Gigs & Short-Term Shift Work */}
      <DailyGigsSection currentCity={locationName} />

      {/* Section 6: Minimalist Feature Highlights Bar (Final Bottom Trust Strip) */}
      <FeatureHighlightsBar />

      {/* All 20 Categories Modal (Opened via 'See All' in Service Category) */}
      <AllCategoriesModal
        isOpen={isAllCategoriesOpen}
        onClose={() => setIsAllCategoriesOpen(false)}
        currentLocation={locationName}
        workers={workers}
        categories={categories}
        onSelectCategory={(cat, isLive) => onSelectCategory?.(cat, isLive)}
      />

      {/* Filter Menu Modal (Opened via Filter icon next to Search bar) */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedCategory={selectedCategoryFilter}
        onSelectCategory={(catName) => setSelectedCategoryFilter(catName)}
        minRating={minRatingFilter}
        onSelectRating={(r) => setMinRatingFilter(r)}
        maxPrice={maxPriceFilter}
        onSelectMaxPrice={(p) => setMaxPriceFilter(p)}
        onReset={() => {
          setSelectedCategoryFilter('All');
          setMinRatingFilter(0);
          setMaxPriceFilter(2000);
        }}
      />

      {/* Notifications Modal (existing functional component) */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadChange={setUnreadNotifCount}
      />

      {/* Location Picker Modal (existing functional component) */}
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
