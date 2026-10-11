import React, { useState } from 'react';
import { 
  Home as HomeIcon, 
  MessageCircle, 
  Calendar, 
  User, 
  Search, 
  MapPin, 
  X, 
  Bell,
  Briefcase,
  Settings,
  ShieldCheck,
  ChevronRight
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
import { WorkerScreen } from './screens/WorkerScreen';
import { AuthModal } from './screens/AuthModal';

function MainLayout() {
  const { currentUser } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'main' | 'worker' | 'admin' | 'detail' | 'chat'
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chat' | 'bookings' | 'profile'
  const [currentRole, setCurrentRole] = useState('customer'); // 'customer' | 'worker' | 'admin'
  const [selectedService, setSelectedService] = useState(null);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCity, setCurrentCity] = useState('Celina, Delaware');

  // Switch role seamlessly
  const handleSwitchRole = (role) => {
    setCurrentRole(role);
    if (role === 'worker') {
      setCurrentScreen('worker');
    } else if (role === 'admin') {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('main');
      setActiveTab('home');
    }
  };

  // Handle Geolocation
  const requestBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
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
      
      {/* Mobile-first Phone Frame */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:h-[92vh] sm:max-h-[880px] bg-white sm:rounded-[40px] sm:shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative sm:border-[8px] sm:border-slate-800">
        
        {/* Status Bar simulation (Time 8:00, Network, Battery) */}
        <div className="w-full h-8 px-6 pt-2 pb-1 flex items-center justify-between text-xs font-bold text-slate-900 bg-white z-40 select-none shrink-0 border-b border-slate-50">
          <span className="text-[13px] font-extrabold tracking-tight">8:00</span>
          
          {/* Quick Role Persona Badge (when not in splash) */}
          {currentScreen !== 'splash' && (
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-700">
              <span className={`w-1.5 h-1.5 rounded-full ${currentRole === 'worker' ? 'bg-[#0EA5E0]' : currentRole === 'admin' ? 'bg-purple-600' : 'bg-emerald-500'}`} />
              <span className="capitalize">{currentRole} Mode</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-800">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/>
            </svg>
            <div className="w-4 h-2.5 border border-slate-800 rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-800 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Global Multi-Role Navigation Bar (Switch effortlessly between Customer, Worker, and Admin) */}
        {currentScreen !== 'splash' && (
          <div className="bg-slate-100/90 border-b border-slate-200/60 px-4 py-1.5 flex items-center justify-between text-[11px] font-extrabold z-30 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSwitchRole('customer')}
                className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                  currentRole === 'customer' && currentScreen === 'main'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🧑 Customer
              </button>
              <button
                onClick={() => handleSwitchRole('worker')}
                className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                  currentRole === 'worker' || currentScreen === 'worker'
                    ? 'bg-[#0EA5E0] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                👷 Pro Worker
              </button>
              <button
                onClick={() => handleSwitchRole('admin')}
                className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                  currentRole === 'admin' || currentScreen === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ⚡ Admin
              </button>
            </div>

            {currentScreen !== 'main' && (
              <button
                onClick={() => {
                  setCurrentScreen('main');
                  setCurrentRole('customer');
                }}
                className="text-[10px] text-[#0EA5E0] font-black underline cursor-pointer"
              >
                Exit to Home
              </button>
            )}
          </div>
        )}

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
                  currentRole={currentRole}
                  onSwitchRole={handleSwitchRole}
                  onOpenAdmin={() => {
                    setCurrentRole('admin');
                    setCurrentScreen('admin');
                  }}
                  onOpenWorker={() => {
                    setCurrentRole('worker');
                    setCurrentScreen('worker');
                  }}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onViewSplash={() => setCurrentScreen('splash')}
                />
              )}
            </>
          )}

          {currentScreen === 'worker' && (
            <WorkerScreen
              onOpenChat={(b) => {
                setActiveChatBooking(b);
                setCurrentScreen('chat');
              }}
              onBack={() => {
                setCurrentScreen('main');
                setCurrentRole('customer');
              }}
            />
          )}

          {currentScreen === 'admin' && (
            <AdminScreen 
              onBack={() => {
                setCurrentScreen('main');
                setCurrentRole('customer');
              }} 
            />
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
              onBack={() => {
                if (currentRole === 'worker') {
                  setCurrentScreen('worker');
                } else {
                  setCurrentScreen('main');
                }
              }}
            />
          )}

        </div>

        {/* Floating Dark Pill Bottom Navigation Bar (Shown on Main Customer Screen) */}
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
