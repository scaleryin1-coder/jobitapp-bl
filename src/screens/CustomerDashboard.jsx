import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { initialCategories, initialBanners, initialServices } from '../data/seedData';
import { useAuth } from '../context/AuthContext';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSearchSection } from '../components/home/HomeSearchSection';
import { BannerCarousel } from '../components/home/BannerCarousel';
import { CategoryRow } from '../components/home/CategoryRow';
import { PopularServiceSection } from '../components/home/PopularServiceSection';
import { NotificationModal } from './NotificationModal';
import { LocationPickerModal } from './LocationPickerModal';

export function CustomerDashboard({ 
  onSelectCategory, 
  onSelectService, 
  onNavigateTab,
  currentCity,
  onUpdateCity,
  onOpenSearch
}) {
  const { currentUser } = useAuth();

  // Existing Data State (preserves existing sources and structure)
  const [categories, setCategories] = useState(initialCategories || []);
  const [banners, setBanners] = useState(initialBanners || []);
  const [services, setServices] = useState(initialServices || []);

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

  // Sync prop changes for currentCity
  useEffect(() => {
    if (currentCity) {
      setLocationName(currentCity);
    }
  }, [currentCity]);

  // Firestore Real-time Sync (identical existing logic)
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#E9F8FD] via-[#F4FAFD] to-[#FFFFFF] pb-24 text-slate-900 select-none">
      
      {/* 1. Header / User Info */}
      <HomeHeader
        currentUser={currentUser}
        locationName={locationName}
        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        unreadNotifCount={unreadNotifCount}
      />

      {/* 2. Main Title + Search */}
      <HomeSearchSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        onOpenSearch={() => onOpenSearch?.()}
        searchResults={searchResults}
        categories={categories}
        onSelectCategory={(cat) => onSelectCategory?.(cat)}
        onSelectService={(serv) => onSelectService?.(serv)}
      />

      {/* 3. Promotional Banner / Carousel */}
      <BannerCarousel
        banners={banners}
        services={services}
        onSelectService={(serv) => onSelectService?.(serv)}
      />

      {/* 4. Service Category */}
      <CategoryRow
        categories={categories}
        onSelectCategory={(cat) => onSelectCategory?.(cat)}
        onOpenAll={() => onOpenSearch?.()}
      />

      {/* 5. Popular Service */}
      <PopularServiceSection
        services={services}
        onSelectService={(serv) => onSelectService?.(serv)}
        onOpenAll={() => onOpenSearch?.()}
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
