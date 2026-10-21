import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  Building2, 
  Flame,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Store
} from 'lucide-react';
import { subscribeDailyGigs } from '../../data/bookingService';
import { PostGigModal } from './PostGigModal';
import { GigDetailModal } from './GigDetailModal';

const FILTER_TABS = [
  { id: 'all', label: 'All Vacancies' },
  { id: 'urgent', label: '⚡ Urgent Shifts' },
  { id: 'today', label: '🔥 1-Day Work' },
  { id: 'retail', label: '🏪 Retail & Shop' },
  { id: 'delivery', label: '🚚 Delivery & Fuel' }
];

export function DailyGigsSection({ currentCity = 'Melattur, Kerala' }) {
  const [gigs, setGigs] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showAllGrid, setShowAllGrid] = useState(false);

  useEffect(() => {
    const unsub = subscribeDailyGigs((list) => {
      if (Array.isArray(list)) {
        // Sort active & urgent vacancies to the top
        const sorted = [...list].sort((a, b) => {
          if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
          if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        setGigs(sorted);
      }
    });

    return () => unsub();
  }, []);

  const filteredGigs = gigs.filter((gig) => {
    if (gig.status && gig.status !== 'active') return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent') return gig.urgency === 'urgent';
    if (activeFilter === 'today') return gig.duration?.toLowerCase().includes('today') || gig.duration?.toLowerCase().includes('1-day') || gig.urgency === 'today';
    if (activeFilter === 'retail') {
      const cat = (gig.category || '').toLowerCase();
      const title = (gig.title || '').toLowerCase();
      return cat.includes('retail') || cat.includes('shop') || cat.includes('billing') || title.includes('supermarket') || title.includes('shop');
    }
    if (activeFilter === 'delivery') {
      const cat = (gig.category || '').toLowerCase();
      const title = (gig.title || '').toLowerCase();
      return cat.includes('delivery') || cat.includes('fuel') || cat.includes('auto') || title.includes('petrol') || title.includes('delivery');
    }
    return true;
  });

  const handleCardClick = (gig) => {
    setSelectedGig(gig);
    setIsDetailModalOpen(true);
  };

  return (
    <section className="w-full px-4 sm:px-5 py-3 select-none">
      {/* 1. Page Background Frame: Subtle Tinted Cream/Amber Container providing depth & contrast */}
      <div className="w-full rounded-3xl bg-amber-50/30 border border-amber-100/70 p-4 sm:p-5 shadow-xs">
        
        {/* Header Row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Daily Gigs & Shift Work
            </h2>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/80">
              ⚡ Urgent Shifts
            </span>
          </div>

          {/* Primary Action Button: Warm Amber/Gold Tone */}
          <button
            type="button"
            onClick={() => setIsPostModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            <span>Post a Gig</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 font-medium mb-3">
          Short-term staff needed in {currentCity.split(',')[0]} (Petrol pumps, retail stores, delivery & helpers)
        </p>

        {/* 2. Interactive Filter Tabs: Modern Amber Tone */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 pt-0.5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white hover:bg-amber-50/70 text-slate-700 border-slate-200/90 shadow-2xs'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 3. Cards Container (Horizontal Snap Scroll on mobile, responsive grid on desktop/expanded) */}
        {filteredGigs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 text-center space-y-2 mt-1 shadow-sm">
            <Briefcase className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No shift vacancies in this category</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Need temporary staff for your shop or business? Post an urgent vacancy in under a minute.
            </p>
            <button
              type="button"
              onClick={() => setIsPostModalOpen(true)}
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Post First Vacancy
            </button>
          </div>
        ) : showAllGrid ? (
          /* Full Grid Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-1">
            {filteredGigs.map((gig) => (
              <GigCard 
                key={gig.id} 
                gig={gig} 
                onCardClick={() => handleCardClick(gig)} 
              />
            ))}
          </div>
        ) : (
          /* Modern Horizontal Scroller with Clean White Cards & Left Amber Highlight */
          <div className="relative mt-1">
            <div className="flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1">
              {filteredGigs.map((gig) => (
                <div 
                  key={gig.id} 
                  className="w-[285px] sm:w-[320px] shrink-0 snap-start flex"
                >
                  <GigCard 
                    gig={gig} 
                    onCardClick={() => handleCardClick(gig)} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Strip with Quick Action & Grid Toggle */}
        <div className="flex items-center justify-between pt-3 px-0.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>{filteredGigs.length} active shift positions open</span>
          </div>

          {filteredGigs.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllGrid(!showAllGrid)}
              className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer transition active:scale-95"
            >
              <span>{showAllGrid ? 'Carousel View' : 'View All Grid'}</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Post a Gig Modal Drawer */}
      <PostGigModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        currentCity={currentCity}
        onGigCreated={(newGig) => {
          setSelectedGig(newGig);
        }}
      />

      {/* Gig Details Modal */}
      <GigDetailModal
        gig={selectedGig}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </section>
  );
}

/**
 * Clean White Gig Card with Warm Amber Left Highlight Strip & Soft Shadow
 */
function GigCard({ gig, onCardClick }) {
  const cleanWhatsappNumber = (gig.whatsapp_number || gig.contact_number || '').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber.startsWith('91') ? cleanWhatsappNumber : `91${cleanWhatsappNumber}`}?text=${encodeURIComponent(
    `Hello, I saw your "${gig.title}" daily vacancy on JOBit at ${gig.shop_name}. I am available for this shift.`
  )}`;

  const isUrgent = gig.urgency === 'urgent';
  const isToday = gig.urgency === 'today' || gig.duration?.toLowerCase().includes('today') || gig.duration?.toLowerCase().includes('1-day');

  return (
    <div className="w-full h-full bg-white rounded-2xl p-4 border border-slate-200/80 border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all flex flex-col justify-between group">
      
      {/* Card Clickable Body */}
      <div className="cursor-pointer space-y-2.5" onClick={onCardClick}>
        {/* Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isUrgent ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wide flex items-center gap-1 border border-amber-200">
                <Zap className="w-2.5 h-2.5 fill-amber-700 text-amber-700" />
                <span>Urgent</span>
              </span>
            ) : isToday ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-bold tracking-wide flex items-center gap-1 border border-amber-200/80">
                <Flame className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                <span>1-Day</span>
              </span>
            ) : null}

            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
              {gig.duration}
            </span>
          </div>

          <span className="text-[10px] font-bold text-amber-900/80 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 truncate max-w-[110px]">
            {gig.category || 'Shift'}
          </span>
        </div>

        {/* Job Title */}
        <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors leading-snug line-clamp-1">
          {gig.title}
        </h4>

        {/* Employer & Location Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{gig.shop_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{gig.location}</span>
          </div>
        </div>

        {/* Clean Wage & Timing Box */}
        <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Daily Wage
            </span>
            <span className="text-sm font-black text-slate-900 font-mono tracking-tight tabular-nums block">
              {gig.wage}
            </span>
          </div>

          <div className="text-right border-l border-slate-200 pl-3">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Timing
            </span>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{gig.timing || 'Day Shift'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: "Call Now" (Dark Slate) & "WhatsApp" (Emerald Green) */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
        <a
          href={`tel:${gig.contact_number}`}
          onClick={(e) => e.stopPropagation()}
          title={`Call ${gig.shop_name}`}
          className="h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-slate-300 stroke-[2.2]" />
          <span>Call Now</span>
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`WhatsApp ${gig.shop_name}`}
          className="h-9 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
