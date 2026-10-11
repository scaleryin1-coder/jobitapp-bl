import React, { useState } from 'react';
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
import { HomeScreen } from './screens/HomeScreen';
import { ServiceDetailScreen } from './screens/ServiceDetailScreen';
import { BookingModal } from './screens/BookingModal';
import { BookingsScreen } from './screens/BookingsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminScreen } from './screens/AdminScreen';
import { AuthModal } from './screens/AuthModal';

function MainLayout() {
  const { currentUser } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'main' | 'detail' | 'chat' | 'admin'
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chat' | 'bookings' | 'profile'
  const [selectedService, setSelectedService] = useState(null);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCity, setCurrentCity] = useState('Celina, Delaware');

  // Handle Geolocation
  const requestBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCity("Current Location (GPS)");
          setCityPickerOpen(false);
        },
        () => {
          setCurrentCity("Celina, Delaware");
          setCityPickerOpen(false);
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center sm:p-4 select-none">
      
      {/* Mobile-first Phone Frame (Width capped at 430px for native mobile experience) */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[92vh] sm:max-h-[880px] bg-white sm:rounded-[40px] sm:shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative sm:border-[8px] sm:border-slate-800">
        
        {/* Status Bar simulation (Time 8:00, Network, Battery) */}
        <div className="w-full h-8 px-6 pt-2 pb-1 flex items-center justify-between text-xs font-bold text-slate-900 bg-white z-40 select-none shrink-0">
          <span className="text-[13px] font-extrabold tracking-tight">8:00</span>
          <div className="flex items-center gap-1.5 text-slate-800">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/>
            </svg>
            <div className="w-4 h-2.5 border border-slate-800 rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-800 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Dynamic Screen View */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
          
          {currentScreen === 'splash' && (
            <SplashScreen
              onGetStarted={() => {
                setCurrentScreen('main');
              }}
            />
          )}

          {currentScreen === 'main' && (
            <>
              {activeTab === 'home' && (
                <HomeScreen
                  currentCity={currentCity}
                  onChangeCity={() => setCityPickerOpen(true)}
                  onOpenSearch={() => setSearchModalOpen(true)}
                  onOpenNotifications={() => alert("All bookings and offers are up-to-date!")}
                  onSelectCategory={(cat) => {
                    // Navigate or filter
                  }}
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
                  onOpenAdmin={() => setCurrentScreen('admin')}
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
                setCurrentScreen('main');
                setActiveTab('chat');
              }}
            />
          )}

          {currentScreen === 'admin' && (
            <AdminScreen onBack={() => setCurrentScreen('main')} />
          )}

        </div>

        {/* Floating Dark Pill Bottom Navigation Bar (Shown on Main Screen) */}
        {currentScreen === 'main' && (
          <div className="absolute inset-x-0 bottom-4 px-6 z-40 pointer-events-none flex justify-center">
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

        {/* Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setCurrentScreen('main');
          }}
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
                {['Celina, Delaware', 'Mumbai, MH', 'Bengaluru, KA', 'Delhi NCR', 'Hyderabad, TS'].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setCurrentCity(city);
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
