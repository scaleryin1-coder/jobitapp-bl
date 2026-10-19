import React, { useState, useEffect } from 'react';
import './index.css';
import './App.css';
import { 
  Home as HomeIcon, 
  MessageCircle, 
  Calendar, 
  User, 
  Search, 
  MapPin, 
  X, 
  Bell
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './screens/SplashScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { CustomerDashboard } from './screens/CustomerDashboard';
import { ServiceListScreen } from './screens/ServiceList';
import { ServiceDetailScreen } from './screens/ServiceDetailScreen';
import { BookingModal } from './screens/BookingModal';
import { BookingsScreen } from './screens/BookingsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminScreen } from './screens/AdminScreen';
import { WorkerScreen } from './screens/WorkerScreen';
import { AuthModal } from './screens/AuthModal';
import { PartnerLoginModal } from './screens/PartnerLoginModal';
import { WorkerOnboardingModal } from './screens/WorkerOnboardingModal';
import { ProfileDrawerModal } from './screens/ProfileDrawerModal';
import { SkilledProfessionalSelectionScreen } from './screens/SkilledProfessionalSelectionScreen';
import { LocationPickerModal } from './screens/LocationPickerModal';
import { ComingSoonCategoryModal } from './components/common/ComingSoonCategoryModal';
import { isPortfolioCategory } from './data/categoriesData';
import { subscribeWorkers, isCategoryAvailableInLocation } from './data/bookingService';
import { BottomNav } from './components/BottomNav';

function MainLayout() {
  const { currentUser, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#splash' || hash === '#welcome') return 'splash';
      const saved = localStorage.getItem('jobit_current_screen');
      if (saved && ['main', 'service-list', 'detail', 'portfolio-selection'].includes(saved)) {
        if (saved === 'detail' && !localStorage.getItem('jobit_selected_service')) {
          return 'main';
        }
        if (saved === 'portfolio-selection' && !localStorage.getItem('jobit_selected_portfolio_cat')) {
          return 'main';
        }
        return saved;
      }
    } catch {}
    return 'main';
  }); // 'main' | 'splash' | 'service-list' | 'detail' | 'chat' | 'portfolio-selection'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('jobit_active_tab');
      if (saved && ['home', 'chat', 'bookings', 'profile'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'home';
  }); // 'home' | 'chat' | 'bookings' | 'profile'
  const [selectedCategoryName, setSelectedCategoryName] = useState(() => {
    try {
      return localStorage.getItem('jobit_selected_category_name') || 'All';
    } catch {
      return 'All';
    }
  });
  const [selectedService, setSelectedService] = useState(() => {
    try {
      const saved = localStorage.getItem('jobit_selected_service');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedPortfolioCategory, setSelectedPortfolioCategory] = useState(() => {
    try {
      const saved = localStorage.getItem('jobit_selected_portfolio_cat');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [pendingBookingService, setPendingBookingService] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(() => {
    try {
      const savedUser = localStorage.getItem('jobit_user');
      const hasVerifiedUser = Boolean(savedUser && JSON.parse(savedUser)?.phone);
      const isOpen = localStorage.getItem('jobit_booking_modal_open') === 'true';
      const hasService = Boolean(localStorage.getItem('jobit_selected_service'));
      return isOpen && hasService && hasVerifiedUser;
    } catch {
      return false;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPartnerLoginOpen, setIsPartnerLoginOpen] = useState(false);
  const [isWorkerOnboardingOpen, setIsWorkerOnboardingOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [comingSoonCategory, setComingSoonCategory] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [workers, setWorkers] = useState([]);
  const [currentCity, setCurrentCity] = useState(() => {
    return localStorage.getItem('jobit_user_location') || 'Melattur, Kerala';
  });

  // Verify whether the active user state is verified (authenticated with mobile & name)
  const isUserVerified = Boolean(
    currentUser &&
    currentUser.uid &&
    currentUser.uid !== 'guest_user' &&
    currentUser.phone &&
    currentUser.name &&
    currentUser.name !== 'Guest User'
  );

  // Guest booking interception guard: Require authorization before opening final booking modal
  const handleProceedToBook = (serviceToBook) => {
    if (!serviceToBook) return;

    if (!isUserVerified) {
      // Intercept the click, record the desired service, and trigger the Login Modal
      setPendingBookingService(serviceToBook);
      setIsAuthModalOpen(true);
      return;
    }

    // Authorized user: proceed to booking confirmation step
    setSelectedService(serviceToBook);
    setIsBookingModalOpen(true);
  };

  // State persistence across browser refresh
  useEffect(() => {
    try {
      if (['main', 'service-list', 'detail', 'portfolio-selection'].includes(currentScreen)) {
        localStorage.setItem('jobit_current_screen', currentScreen);
      }
    } catch {}
  }, [currentScreen]);

  // Safety guard against white-screen state if required data is missing
  useEffect(() => {
    if (currentScreen === 'detail' && !selectedService) {
      setCurrentScreen('main');
    } else if (currentScreen === 'portfolio-selection' && !selectedPortfolioCategory) {
      setCurrentScreen('main');
    }
  }, [currentScreen, selectedService, selectedPortfolioCategory]);

  useEffect(() => {
    try {
      localStorage.setItem('jobit_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('jobit_selected_category_name', selectedCategoryName || 'All');
    } catch {}
  }, [selectedCategoryName]);

  useEffect(() => {
    try {
      if (selectedService) {
        localStorage.setItem('jobit_selected_service', JSON.stringify(selectedService));
      } else {
        localStorage.removeItem('jobit_selected_service');
      }
    } catch {}
  }, [selectedService]);

  useEffect(() => {
    try {
      if (selectedPortfolioCategory) {
        localStorage.setItem('jobit_selected_portfolio_cat', JSON.stringify(selectedPortfolioCategory));
      } else {
        localStorage.removeItem('jobit_selected_portfolio_cat');
      }
    } catch {}
  }, [selectedPortfolioCategory]);

  useEffect(() => {
    try {
      localStorage.setItem('jobit_booking_modal_open', isBookingModalOpen ? 'true' : 'false');
    } catch {}
  }, [isBookingModalOpen]);

  // Subscribe to real-time workers to dynamically unlock categories per location
  useEffect(() => {
    const unsub = subscribeWorkers((list) => {
      setWorkers(list || []);
    });
    return () => unsub();
  }, []);

  // Dynamic mobile status bar & theme-color synchronization per active screen/view
  useEffect(() => {
    const getPageThemeColor = () => {
      // 1. Worker & Admin views: Clean white top bar
      if (currentUser?.role === 'worker' || currentUser?.role === 'admin') {
        return '#FFFFFF';
      }

      // 2. Specialized sub-screens: Clean white top bar
      if (currentScreen === 'splash') return '#FFFFFF';
      if (currentScreen === 'service-list') return '#FFFFFF';
      if (currentScreen === 'detail') return '#FFFFFF';
      if (currentScreen === 'portfolio-selection') return '#FFFFFF';
      if (currentScreen === 'chat') return '#FFFFFF';

      // 3. Main tab views
      if (currentScreen === 'main') {
        if (activeTab === 'home') {
          return '#E9F8FD'; // Soft sky blue matching home gradient header
        }
        return '#FFFFFF'; // Bookings, Chat, Profile use crisp white headers
      }

      return '#E9F8FD';
    };

    const targetColor = getPageThemeColor();

    // Update <meta name="theme-color">
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.name = 'theme-color';
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', targetColor);

    // Update <meta name="msapplication-navbutton-color">
    let metaMs = document.querySelector('meta[name="msapplication-navbutton-color"]');
    if (!metaMs) {
      metaMs = document.createElement('meta');
      metaMs.name = 'msapplication-navbutton-color';
      document.head.appendChild(metaMs);
    }
    metaMs.setAttribute('content', targetColor);

    // Update document.body background for seamless overscroll matching
    if (document.body) {
      document.body.style.backgroundColor = targetColor;
    }
  }, [currentUser?.role, currentScreen, activeTab]);

  // Check URL hash for direct partner/staff login route or worker onboarding
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#partner' || hash === '#worker') {
        setIsPartnerLoginOpen(true);
      } else if (hash === '#register-pro' || hash === '#onboard' || hash === '#onboarding' || hash === '#pro') {
        setIsWorkerOnboardingOpen(true);
      } else if (hash === '#splash' || hash === '#welcome') {
        setCurrentScreen('splash');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Handle Live Geolocation with Reverse Geocoding
  const requestBrowserLocation = () => {
    if (navigator.geolocation) {
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
              const resolved = neighborhood && city ? `${neighborhood}, ${city}` : (city || `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
              setCurrentCity(resolved);
              localStorage.setItem('jobit_user_location', resolved);
            } else {
              const fallback = `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
              setCurrentCity(fallback);
              localStorage.setItem('jobit_user_location', fallback);
            }
          } catch {
            const fallback = `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
            setCurrentCity(fallback);
            localStorage.setItem('jobit_user_location', fallback);
          }
          setCityPickerOpen(false);
        },
        () => {
          setCityPickerOpen(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handlePartnerLoginSuccess = (role) => {
    // If logged in as worker or admin, state will automatically re-render strictly into that dashboard
    setIsPartnerLoginOpen(false);
    if (window.location.hash) {
      history.replaceState(null, '', ' ');
    }
  };

  const handleLogoutToCustomer = async () => {
    await logout();
    setCurrentScreen('main');
    setActiveTab('home');
    setSelectedService(null);
    setSelectedPortfolioCategory(null);
    setIsBookingModalOpen(false);
    setActiveChatBooking(null);
  };

  // ==========================================
  // ROLE-BASED STRICT ROUTING
  // ==========================================

  // 1. If authenticated as Worker -> Strictly Worker Dashboard
  if (currentUser?.role === 'worker') {
    if (currentScreen === 'chat') {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-slate-100 flex flex-col items-center justify-start select-none">
          <div className="w-full max-w-md min-h-screen min-h-[100dvh] bg-white shadow-xl flex flex-col relative">
            <ChatScreen
              booking={activeChatBooking || {
                id: 'bk_default',
                customerName: 'Customer',
                serviceTitle: 'Home Service'
              }}
              onBack={() => setCurrentScreen('main')}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-100 flex flex-col items-center justify-start select-none">
        <div className="w-full max-w-md min-h-screen min-h-[100dvh] bg-white shadow-xl flex flex-col relative">
          <WorkerScreen
            onOpenChat={(b) => {
              setActiveChatBooking(b);
              setCurrentScreen('chat');
            }}
            onLogout={handleLogoutToCustomer}
          />
        </div>
      </div>
    );
  }

  // 2. If authenticated as Admin -> Strictly Admin Control Center
  if (currentUser?.role === 'admin') {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-100 flex flex-col items-center justify-start select-none">
        <div className="w-full max-w-md min-h-screen min-h-[100dvh] bg-white shadow-xl flex flex-col relative">
          <AdminScreen
            onBack={handleLogoutToCustomer}
            onLogout={handleLogoutToCustomer}
          />
        </div>
      </div>
    );
  }

  // 3. Default: Customer Dashboard (Service Booking UI)
  const isHomeView = currentScreen === 'main' && activeTab === 'home';

  return (
    <div className={`min-h-screen min-h-[100dvh] ${isHomeView ? 'bg-[#E9F8FD]' : 'bg-slate-100'} flex flex-col items-center justify-start select-none transition-colors duration-200`}>
      
      {/* Clean Web App Container (No phone OS bezel, no hardcoded status bar) */}
      <div className="w-full max-w-[440px] min-h-screen min-h-[100dvh] bg-white shadow-xl flex flex-col relative overflow-x-hidden">
        
        {/* Dynamic Screen View */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
          
          {currentScreen === 'splash' && (
            <WelcomeScreen
              onGetStarted={() => {
                setCurrentScreen('main');
              }}
            />
          )}

          {currentScreen === 'main' && (
            <>
              {activeTab === 'home' && (
                <CustomerDashboard
                  currentCity={currentCity}
                  onChangeCity={() => setCityPickerOpen(true)}
                  onUpdateCity={(city) => setCurrentCity(city)}
                  onOpenSearch={(query) => {
                    setSearchQuery(query || '');
                    setSelectedCategoryName('All');
                    setCurrentScreen('service-list');
                  }}
                  onOpenFilter={(catName) => {
                    setSelectedCategoryName(catName || 'All');
                    setCurrentScreen('service-list');
                  }}
                  onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
                  onSelectCategory={(cat, isLive) => {
                    const catName = cat?.name || 'Home Service';
                    const available = isLive !== undefined 
                      ? isLive 
                      : isCategoryAvailableInLocation(cat, currentCity, workers);

                    if (!available) {
                      setComingSoonCategory(cat);
                      return;
                    }

                    if (isPortfolioCategory(cat || catName)) {
                      setSelectedPortfolioCategory(cat);
                      setCurrentScreen('portfolio-selection');
                      return;
                    }
                    const serviceObj = {
                      id: `cat_${cat?.id || catName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                      title: catName,
                      categoryName: catName,
                      price: cat?.basePrice || 350,
                      subCategories: cat?.subCategories || []
                    };
                    handleProceedToBook(serviceObj);
                  }}
                  onSelectService={(serv) => {
                    if (!isCategoryAvailableInLocation(serv, currentCity, workers)) {
                      setComingSoonCategory(serv);
                      return;
                    }
                    if (isPortfolioCategory(serv)) {
                      setSelectedPortfolioCategory(serv);
                      setCurrentScreen('portfolio-selection');
                      return;
                    }
                    setSelectedService(serv);
                    setCurrentScreen('detail');
                  }}
                  onBookService={(serv) => {
                    if (!isCategoryAvailableInLocation(serv, currentCity, workers)) {
                      setComingSoonCategory(serv);
                      return;
                    }
                    if (isPortfolioCategory(serv)) {
                      setSelectedPortfolioCategory(serv);
                      setCurrentScreen('portfolio-selection');
                      return;
                    }
                    handleProceedToBook(serv);
                  }}
                  onNavigateTab={(tab) => {
                    if (tab === 'bookings') setActiveTab('bookings');
                  }}
                  onOpenWorkerOnboarding={() => setIsWorkerOnboardingOpen(true)}
                />
              )}

              {activeTab === 'chat' && (
                <ChatScreen
                  booking={activeChatBooking || {
                    id: 'bk_default',
                    workerName: 'Assigned Technician',
                    serviceTitle: 'Plumbing Service'
                  }}
                  onBack={() => setActiveTab('home')}
                />
              )}

              {activeTab === 'bookings' && (
                <BookingsScreen
                  onOpenChat={(b) => {
                    setActiveChatBooking(b);
                    setActiveTab('chat');
                  }}
                  onSelectServiceById={(id) => {}}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileScreen
                  onOpenPartnerLogin={() => setIsPartnerLoginOpen(true)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenWorkerOnboarding={() => setIsWorkerOnboardingOpen(true)}
                />
              )}
            </>
          )}

          {currentScreen === 'service-list' && (
            <ServiceListScreen
              initialCategory={selectedCategoryName}
              initialSearch={searchQuery}
              currentCity={currentCity}
              workers={workers}
              onBack={() => setCurrentScreen('main')}
              onSelectService={(serv) => {
                if (!isCategoryAvailableInLocation(serv, currentCity, workers)) {
                  setComingSoonCategory(serv);
                  return;
                }
                if (isPortfolioCategory(serv)) {
                  setSelectedPortfolioCategory(serv);
                  setCurrentScreen('portfolio-selection');
                  return;
                }
                setSelectedService(serv);
                setCurrentScreen('detail');
              }}
              onBookService={(serv) => {
                if (!isCategoryAvailableInLocation(serv, currentCity, workers)) {
                  setComingSoonCategory(serv);
                  return;
                }
                if (isPortfolioCategory(serv)) {
                  setSelectedPortfolioCategory(serv);
                  setCurrentScreen('portfolio-selection');
                  return;
                }
                handleProceedToBook(serv);
              }}
            />
          )}

          {currentScreen === 'portfolio-selection' && (
            <SkilledProfessionalSelectionScreen
              category={selectedPortfolioCategory}
              currentCity={currentCity}
              onBack={() => {
                setSelectedPortfolioCategory(null);
                setCurrentScreen('main');
              }}
              onSelectWorkerToBook={(worker, album) => {
                const catName = selectedPortfolioCategory?.name || selectedPortfolioCategory?.title || worker.skill || 'Skilled Pro';
                const serviceObj = {
                  id: `serv_${worker.id}_${Date.now()}`,
                  title: album ? `${worker.name} - ${album.title}` : `${worker.name} (${worker.skill || catName})`,
                  categoryName: catName,
                  price: worker.startingPrice || selectedPortfolioCategory?.basePrice || 499,
                  workerId: worker.id,
                  workerName: worker.name,
                  workerPhone: worker.phone,
                  workerAvatar: worker.avatar,
                  subCategories: album ? [album.title, `${worker.skill} Custom Service`, 'Standard Inspection'] : [catName, 'Standard Inspection']
                };
                handleProceedToBook(serviceObj);
              }}
            />
          )}

          {currentScreen === 'detail' && selectedService && (
            <ServiceDetailScreen
              service={selectedService}
              currentCity={currentCity}
              workers={workers}
              onBack={() => {
                setSelectedService(null);
                setCurrentScreen('main');
              }}
              onBookNow={() => {
                if (!isCategoryAvailableInLocation(selectedService, currentCity, workers)) {
                  setComingSoonCategory(selectedService);
                  return;
                }
                handleProceedToBook(selectedService);
              }}
              onOpenChat={() => {
                setActiveChatBooking({
                  id: 'bk_' + selectedService.id,
                  workerName: selectedService.workerName,
                  serviceTitle: selectedService.title
                });
                setCurrentScreen('chat');
              }}
            />
          )}

          {currentScreen === 'chat' && (
            <ChatScreen
              booking={activeChatBooking || {
                id: 'bk_default',
                workerName: 'Assigned Technician',
                serviceTitle: 'Home Service'
              }}
              onBack={() => setCurrentScreen('main')}
            />
          )}

        </div>

        {/* Bottom Navigation Bar matching reference design */}
        {currentScreen === 'main' && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Booking Bottom Sheet */}
        <BookingModal
          service={selectedService}
          currentCity={currentCity}
          workers={workers}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onRequireAuth={() => {
            setIsBookingModalOpen(false);
            setPendingBookingService(selectedService);
            setIsAuthModalOpen(true);
          }}
          onSuccess={() => {
            setCurrentScreen('main');
            setActiveTab('bookings');
          }}
        />

        {/* Customer Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          bookingPrompt={Boolean(pendingBookingService)}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingBookingService(null);
          }}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            if (pendingBookingService) {
              const target = pendingBookingService;
              setPendingBookingService(null);
              setSelectedService(target);
              setIsBookingModalOpen(true);
            } else {
              setCurrentScreen('main');
            }
          }}
          onOpenWorkerOnboarding={() => {
            setIsAuthModalOpen(false);
            setPendingBookingService(null);
            setIsWorkerOnboardingOpen(true);
          }}
        />

        {/* Separate Partner & Staff Portal Modal (Workers & Admins) */}
        <PartnerLoginModal
          isOpen={isPartnerLoginOpen}
          onClose={() => {
            setIsPartnerLoginOpen(false);
            if (window.location.hash) {
              history.replaceState(null, '', ' ');
            }
          }}
          onSuccess={handlePartnerLoginSuccess}
          onOpenWorkerOnboarding={() => {
            setIsPartnerLoginOpen(false);
            setIsWorkerOnboardingOpen(true);
          }}
        />

        {/* Multi-Step Partner / Worker Onboarding Modal */}
        <WorkerOnboardingModal
          isOpen={isWorkerOnboardingOpen}
          onClose={() => {
            setIsWorkerOnboardingOpen(false);
            if (window.location.hash) {
              history.replaceState(null, '', ' ');
            }
          }}
          onSuccess={() => {
            setIsWorkerOnboardingOpen(false);
            if (window.location.hash) {
              history.replaceState(null, '', ' ');
            }
          }}
        />

        {/* Floating Profile Card / Drawer Modal */}
        <ProfileDrawerModal
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          onLogoutComplete={() => {
            setIsProfileDrawerOpen(false);
            setCurrentScreen('main');
            setActiveTab('home');
          }}
          onOpenWorkerOnboarding={() => {
            setIsProfileDrawerOpen(false);
            setIsWorkerOnboardingOpen(true);
          }}
          onOpenAuth={() => {
            setIsProfileDrawerOpen(false);
            setIsAuthModalOpen(true);
          }}
        />

        {/* Real Dynamic Location Picker Dialog (Rollout Zones: Melattur, Pattikkad, Pandikkad) */}
        <LocationPickerModal
          isOpen={cityPickerOpen}
          onClose={() => setCityPickerOpen(false)}
          currentCity={currentCity}
          onSelectLocation={(newCity) => {
            setCurrentCity(newCity);
            localStorage.setItem('jobit_user_location', newCity);
          }}
        />

        {/* Dynamic Category Availability: Coming Soon to Your Area Modal */}
        <ComingSoonCategoryModal
          isOpen={Boolean(comingSoonCategory)}
          category={comingSoonCategory}
          currentLocation={currentCity}
          onClose={() => setComingSoonCategory(null)}
          onSwitchLocation={(newLoc) => {
            setCurrentCity(newLoc);
            localStorage.setItem('jobit_user_location', newLoc);
          }}
          onOpenWorkerOnboarding={(loc, trade) => {
            setComingSoonCategory(null);
            setIsWorkerOnboardingOpen(true);
          }}
        />

        {/* Search Modal */}
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-slate-900">Search Home Services</h4>
                <button onClick={() => setSearchModalOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. AC Repair, Plumber, Cleaner..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-[#0EA5E0]"
                />
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {['Plumbing Inspection & Repair', 'AC Deep Jet Wash', 'Deep Kitchen Cleaning', 'Electrician Diagnostics', 'Wall Paint & Polish'].map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchModalOpen(false);
                      setCurrentScreen('main');
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 flex items-center justify-between"
                  >
                    <span>{s}</span>
                    <span className="text-[11px] text-[#0EA5E0] font-bold">View</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}
