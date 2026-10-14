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
    <section className="px-5 my-5 select-none">
      {/* 1. Soft Pastel Yellow Header & Hero Action Strip */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FEF9C3] to-[#FFFBEB] p-4 sm:p-5 shadow-[0_4px_20px_rgba(245,158,11,0.06)] border border-[#FDE68A]/80 text-slate-900 overflow-hidden mb-3">
        {/* Subtle Ambient Decorative Glow Accents */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-yellow-200/30 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 text-amber-900 border border-amber-300/70 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Urgent Daily Vacancies</span>
              </span>
              <span className="text-[11px] font-bold text-amber-950/75">
                · Spot Cash Wage
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
              Daily Gigs & Shift Work
            </h3>
            <p className="text-xs font-bold text-slate-700 max-w-md leading-snug">
              Short-term staff needed today in {currentCity.split(',')[0]} (Petrol pumps, stores, helpers)
            </p>
          </div>

          {/* "Post a Gig" Trigger Button */}
          <button
            type="button"
            onClick={() => setIsPostModalOpen(true)}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-black shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer border border-slate-800"
          >
            <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
            <span>Post a Gig</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter Tabs Styled with Yellow Palette */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 pt-0.5">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.35)] scale-102'
                  : 'bg-white hover:bg-amber-50/70 text-slate-700 border-amber-200/70 shadow-2xs'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Cards Container (Horizontal Snap Scroll on mobile, responsive grid on desktop/expanded) */}
      {filteredGigs.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-2 mt-1 shadow-xs">
          <Briefcase className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No shift vacancies in this category</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Need temporary staff for your shop or business? Post an urgent vacancy in under a minute.
          </p>
          <button
            type="button"
            onClick={() => setIsPostModalOpen(true)}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 rounded-xl text-xs font-black shadow-xs hover:from-amber-500 hover:to-yellow-500 transition cursor-pointer"
          >
            Post First Vacancy
          </button>
        </div>
      ) : showAllGrid ? (
        /* Full Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-1">
          {filteredGigs.map((gig) => (
            <ModernYellowGigCard 
              key={gig.id} 
              gig={gig} 
              onCardClick={() => handleCardClick(gig)} 
            />
          ))}
        </div>
      ) : (
        /* Modern Horizontal Scroller with Yellow Glass Cards */
        <div className="relative mt-1">
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5">
            {filteredGigs.map((gig) => (
              <div 
                key={gig.id} 
                className="w-[290px] sm:w-[325px] shrink-0 snap-start"
              >
                <ModernYellowGigCard 
                  gig={gig} 
                  onCardClick={() => handleCardClick(gig)} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Strip with Quick Action & Grid Toggle */}
      <div className="flex items-center justify-between pt-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>{filteredGigs.length} active shift positions open</span>
        </div>

        {filteredGigs.length > 2 && (
          <button
            type="button"
            onClick={() => setShowAllGrid(!showAllGrid)}
            className="font-black text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer transition active:scale-95"
          >
            <span>{showAllGrid ? 'Carousel View' : 'View All Grid'}</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
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
 * Modern Yellow Gig Card Component
 */
function ModernYellowGigCard({ gig, onCardClick }) {
  const cleanWhatsappNumber = (gig.whatsapp_number || gig.contact_number || '').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber.startsWith('91') ? cleanWhatsappNumber : `91${cleanWhatsappNumber}`}?text=${encodeURIComponent(
    `Hello, I saw your "${gig.title}" daily vacancy on JOBit at ${gig.shop_name}. I am available for this shift.`
  )}`;

  const isUrgent = gig.urgency === 'urgent';
  const isToday = gig.urgency === 'today' || gig.duration?.toLowerCase().includes('today') || gig.duration?.toLowerCase().includes('1-day');

  return (
    <div className="h-full bg-gradient-to-b from-amber-50/50 via-white to-white rounded-3xl p-4 border border-amber-200/90 shadow-[0_4px_18px_rgba(245,158,11,0.08)] hover:shadow-[0_8px_26px_rgba(245,158,11,0.16)] hover:border-amber-400/80 transition-all flex flex-col justify-between group relative overflow-hidden">
      
      {/* Top Vibrant Yellow Accent Glow Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

      {/* Card Clickable Body */}
      <div className="cursor-pointer" onClick={onCardClick}>
        {/* Badges Row */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isUrgent ? (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black tracking-wide flex items-center gap-1 border border-amber-400/50 shadow-2xs">
                <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>⚡ Urgent</span>
              </span>
            ) : isToday ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black tracking-wide flex items-center gap-1 shadow-2xs">
                <Flame className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                <span>1-Day Work</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[10px] font-black tracking-wide border border-amber-200">
                {gig.duration}
              </span>
            )}

            <span className="px-2 py-0.5 rounded-full bg-slate-100/90 text-slate-700 text-[10px] font-bold">
              {gig.duration}
            </span>
          </div>

          <span className="text-[10px] font-extrabold text-amber-800/80 bg-amber-100/50 px-2 py-0.5 rounded-lg">
            {gig.category || 'Shift'}
          </span>
        </div>

        {/* Job Title */}
        <h4 className="text-[15px] font-black text-slate-950 group-hover:text-amber-700 transition-colors leading-snug line-clamp-1">
          {gig.title}
        </h4>

        {/* Employer & Location Details */}
        <div className="mt-1.5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 truncate">
            <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{gig.shop_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 truncate">
            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="truncate">{gig.location}</span>
          </div>
        </div>

        {/* Striking Yellow Wage Tag Box */}
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-slate-950 border border-amber-400/80 shadow-[0_2px_10px_rgba(245,158,11,0.18)] flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-950 block opacity-85">
              ₹ Daily Wage
            </span>
            <span className="text-base font-black text-slate-950 font-mono tracking-tight tabular-nums block">
              {gig.wage}
            </span>
          </div>

          <div className="text-right border-l border-amber-500/40 pl-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-950 block opacity-85">
              Hours
            </span>
            <span className="text-xs font-black text-slate-950 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-900" />
              <span>{gig.timing || 'Day Shift'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: "Call Now" (Dark High Contrast) & "WhatsApp" (Emerald Green) */}
      <div className="grid grid-cols-2 gap-2 mt-3.5 pt-2 border-t border-amber-100">
        <a
          href={`tel:${gig.contact_number}`}
          onClick={(e) => e.stopPropagation()}
          title={`Call ${gig.shop_name}`}
          className="h-10 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
          <span>Call Now</span>
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`WhatsApp ${gig.shop_name}`}
          className="h-10 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
