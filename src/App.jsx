import React, { useState, useEffect } from 'react';
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
import { ServiceDetailScreen } from './screens/ServiceDetailScreen';
import { BookingModal } from './screens/BookingModal';
import { BookingsScreen } from './screens/BookingsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminScreen } from './screens/AdminScreen';
import { WorkerScreen } from './screens/WorkerScreen';
import { AuthModal } from './screens/AuthModal';
import { PartnerLoginModal } from './screens/PartnerLoginModal';

function MainLayout() {
  const { currentUser, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'main' | 'detail' | 'chat'
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chat' | 'bookings' | 'profile'
  const [selectedService, setSelectedService] = useState(null);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPartnerLoginOpen, setIsPartnerLoginOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCity, setCurrentCity] = useState(() => {
    return localStorage.getItem('jobit_user_location') || 'Melattur, Kerala';
  });

  // Check URL hash for direct partner/staff login route (e.g. #partner, #worker, #admin)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#partner' || hash === '#worker' || hash === '#admin') {
        setIsPartnerLoginOpen(true);
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
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
  };

  // ==========================================
  // ROLE-BASED STRICT ROUTING
  // ==========================================

  // 1. If authenticated as Worker -> Strictly Worker Dashboard
  if (currentUser?.role === 'worker') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start select-none">
        <div className="w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col relative">
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
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start select-none">
        <div className="w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col relative">
          <AdminScreen
            onBack={handleLogoutToCustomer}
            onLogout={handleLogoutToCustomer}
          />
        </div>
      </div>
    );
  }

  // 3. Default: Customer Dashboard (Service Booking UI)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start select-none">
      
      {/* Clean Web App Container (No phone OS bezel, no hardcoded status bar) */}
      <div className="w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col relative">
        
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
                  onOpenSearch={() => setSearchModalOpen(true)}
                  onOpenNotifications={() => alert("All bookings and offers are up-to-date!")}
                  onSelectCategory={(cat) => {}}
                  onSelectService={(serv) => {
                    setSelectedService(serv);
                    setCurrentScreen('detail');
                  }}
                  onNavigateTab={(tab) => {
                    if (tab === 'bookings') setActiveTab('bookings');
                  }}
                />
              )}

              {activeTab === 'chat' && (
                <ChatScreen
                  booking={activeChatBooking || {
                    id: 'bk_default',
                    workerName: 'Rajesh Sharma',
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
                  onViewSplash={() => setCurrentScreen('splash')}
                />
              )}
            </>
          )}

          {currentScreen === 'detail' && selectedService && (
            <ServiceDetailScreen
              service={selectedService}
              onBack={() => setCurrentScreen('main')}
              onBookNow={() => setIsBookingModalOpen(true)}
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
                workerName: 'Rajesh Sharma',
                serviceTitle: 'Home Service'
              }}
              onBack={() => setCurrentScreen('main')}
            />
          )}

        </div>

        {/* Floating Dark Pill Bottom Navigation Bar (Shown on Main Customer Screen) */}
        {currentScreen === 'main' && (
          <div className="fixed sm:absolute inset-x-0 bottom-4 px-6 z-40 pointer-events-none flex justify-center">
            <nav className="pointer-events-auto bg-[#181A20] text-white rounded-full px-4 py-2 shadow-floating flex items-center justify-between gap-5 border border-white/10 backdrop-blur-md">
              
              {/* 1. Home */}
              <button
                onClick={() => setActiveTab('home')}
                className={`transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  activeTab === 'home'
                    ? 'w-10 h-10 rounded-full bg-[#0EA5E0] text-white shadow-glow'
                    : 'w-9 h-9 rounded-full text-[#9CA3AF] hover:text-white'
                }`}
                title="Home"
              >
                <HomeIcon className="w-5 h-5 stroke-[2]" />
              </button>

              {/* 2. Chat */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  activeTab === 'chat'
                    ? 'w-10 h-10 rounded-full bg-[#0EA5E0] text-white shadow-glow'
                    : 'w-9 h-9 rounded-full text-[#9CA3AF] hover:text-white'
                }`}
                title="Chat"
              >
                <MessageCircle className="w-5 h-5 stroke-[2]" />
              </button>

              {/* 3. Bookings Calendar */}
              <button
                onClick={() => setActiveTab('bookings')}
                className={`transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'w-10 h-10 rounded-full bg-[#0EA5E0] text-white shadow-glow'
                    : 'w-9 h-9 rounded-full text-[#9CA3AF] hover:text-white'
                }`}
                title="Bookings"
              >
                <Calendar className="w-5 h-5 stroke-[2]" />
              </button>

              {/* 4. Profile */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  activeTab === 'profile'
                    ? 'w-10 h-10 rounded-full bg-[#0EA5E0] text-white shadow-glow'
                    : 'w-9 h-9 rounded-full text-[#9CA3AF] hover:text-white'
                }`}
                title="Profile"
              >
                <User className="w-5 h-5 stroke-[2]" />
              </button>

            </nav>
          </div>
        )}

        {/* Booking Bottom Sheet */}
        <BookingModal
          service={selectedService}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
            setCurrentScreen('main');
            setActiveTab('bookings');
          }}
        />

        {/* Customer Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setCurrentScreen('main');
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
        />

        {/* City Location Picker Dialog */}
        {cityPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl relative border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-slate-900">Select City</h4>
                <button onClick={() => setCityPickerOpen(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <button
                onClick={requestBrowserLocation}
                className="w-full py-2.5 px-3 mb-3 rounded-2xl bg-sky-50 text-[#0EA5E0] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-4 h-4" />
                Use Current Location (GPS)
              </button>

              <div className="space-y-1">
                {['Mumbai, Maharashtra', 'Bengaluru, Karnataka', 'Delhi NCR', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Chennai, Tamil Nadu'].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setCurrentCity(city);
                      localStorage.setItem('jobit_user_location', city);
                      setCityPickerOpen(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-semibold transition ${
                      currentCity === city ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
