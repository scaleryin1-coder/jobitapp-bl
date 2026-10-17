import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Clock } from 'lucide-react';
import { isCategoryAvailableInLocation } from '../../data/bookingService';

/**
 * Image configurations:
 * 1. AC Service Worker Photo (Untouched original Kommodo direct asset)
 * 2. Coconut Tree Climber Photo (Machine climber image in Kerala grove with multi-tier fallback)
 */
const AC_TECHNICIAN_HERO_IMAGE = 'https://kommodo.ai/i/6x5oOPsxxTObOhMuPqNT';
const AC_TECHNICIAN_HERO_DIRECT = 'https://plain-apac-prod-public.komododecks.com/202610/13/6x5oOPsxxTObOhMuPqNT/image.png';
const AC_TECHNICIAN_HERO_FALLBACK = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80';

const COCONUT_HERO_PRIMARY = '/src/assets/images/coconut_tree_climber_1792078093859.jpg';
const COCONUT_HERO_DIRECT = '/assets/images/coconut_climber.jpg';
const COCONUT_HERO_FALLBACK = '/src/assets/images/coconut_tree_climber_1792078093859.jpg';

const PUNCHER_HERO_PRIMARY = '/src/assets/images/puncher_work_1792197565267.jpg';
const PUNCHER_HERO_DIRECT = '/assets/images/puncher_work.jpg';
const PUNCHER_HERO_FALLBACK = 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80';

function BannerHeroImage({ primarySrc, directSrc, fallbackSrc, alt }) {
  const [currentSrc, setCurrentSrc] = useState(primarySrc);

  const handleError = () => {
    if (currentSrc === primarySrc && directSrc) {
      setCurrentSrc(directSrc);
    } else if (currentSrc !== fallbackSrc && fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={currentSrc}
      onError={handleError}
      alt={alt}
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover object-center"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      loading="eager"
      decoding="async"
    />
  );
}

export function MiddleBannerCarousel({
  services = [],
  currentLocation = 'Melattur, Kerala',
  workers = [],
  onSelectService,
  onBookService
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);
  const isInteracting = useRef(false);

  const isAcLive = isCategoryAvailableInLocation({ id: 'cat_ac', name: 'AC Service' }, currentLocation, workers);
  const isCocoLive = isCategoryAvailableInLocation({ id: 'cat_coconut_tree', name: 'Coconut Tree Climbing' }, currentLocation, workers);
  const isPuncherLive = isCategoryAvailableInLocation({ id: 'cat_puncher', name: 'Puncher Work' }, currentLocation, workers) || 
                        isCategoryAvailableInLocation({ id: 'cat_bike', name: 'Bike Service' }, currentLocation, workers);

  const handleBookAC = () => {
    const acService = (services || []).find(s => {
      const text = `${s?.title || ''} ${s?.categoryName || ''} ${s?.categoryId || ''}`.toLowerCase();
      return text.includes('ac') || text.includes('air') || text.includes('cool');
    }) || {
      id: 'serv_ac_technician',
      title: 'AC Service & Jet Wash',
      categoryName: 'AC Service',
      price: 650,
      subCategories: ['AC Jet Wash', 'Gas Charging & Cooling Check', 'Split AC Installation']
    };

    if (onBookService) {
      onBookService(acService);
    } else if (onSelectService) {
      onSelectService(acService);
    }
  };

  const handleBookCoconutClimber = () => {
    const cocoService = (services || []).find(s => {
      const text = `${s?.title || ''} ${s?.categoryName || ''} ${s?.categoryId || ''}`.toLowerCase();
      return text.includes('coconut') || text.includes('തെങ്ങ്') || text.includes('climb') || text.includes('tree');
    }) || {
      id: 'serv_coconut_tree_climbing',
      title: 'Coconut Tree Climbing & Cleaning (തെങ്ങ് കയറ്റം)',
      categoryName: 'Coconut Tree Climbing',
      categoryId: 'cat_coconut_tree',
      price: 650,
      advancePaid: 99,
      remainingDue: 551,
      heroImage: '/src/assets/images/coconut_tree_climber_1792078093859.jpg',
      subCategories: [
        'Machine Coconut Tree Climbing & Harvesting',
        'Coconut Crown Cleaning & Leaf Trimming',
        'Pest Inspection & Rhinoceros Beetle Treatment',
        'Emergency Dry Frond Clearing'
      ]
    };

    if (onBookService) {
      onBookService(cocoService);
    } else if (onSelectService) {
      onSelectService(cocoService);
    }
  };

  const handleBookPuncherWork = () => {
    const puncherService = (services || []).find(s => {
      const text = `${s?.title || ''} ${s?.categoryName || ''} ${s?.categoryId || ''}`.toLowerCase();
      return text.includes('puncher') || text.includes('puncture') || text.includes('tyre') || text.includes('tire');
    }) || {
      id: 'serv_puncher_1',
      title: 'Puncher Work & Tyre Repair',
      categoryName: 'Puncher Work',
      categoryId: 'cat_puncher',
      price: 199,
      advancePaid: 99,
      remainingDue: 100,
      heroImage: '/assets/images/puncher_work.jpg',
      imageUrl: '/assets/images/puncher_work.jpg',
      subCategories: [
        'Tubeless Tyre Puncture Repair',
        'Tube Tyre Puncture Patch & Air Check',
        'Emergency Roadside Puncture Assistance',
        'Tyre Valve & Pressure Check'
      ]
    };

    if (onBookService) {
      onBookService(puncherService);
    } else if (onSelectService) {
      onSelectService(puncherService);
    }
  };

  // Sync scroll position with activeIdx
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const idx = Math.round(scrollLeft / clientWidth);
    if ((idx === 0 || idx === 1 || idx === 2) && idx !== activeIdx) {
      setActiveIdx(idx);
    }
  };

  const scrollToSlide = (idx) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth'
    });
    setActiveIdx(idx);
  };

  // Smooth auto-scroll timer (advances every 4.8 seconds, pauses when user touches/interacts)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isInteracting.current && scrollRef.current) {
        const nextIdx = (activeIdx + 1) % 3;
        scrollToSlide(nextIdx);
      }
    }, 4800);

    return () => clearInterval(interval);
  }, [activeIdx]);

  return (
    <div 
      className="w-full px-5 py-2.5"
      onMouseEnter={() => { isInteracting.current = true; }}
      onMouseLeave={() => { isInteracting.current = false; }}
      onTouchStart={() => { isInteracting.current = true; }}
      onTouchEnd={() => { isInteracting.current = false; }}
    >
      {/* Horizontal smooth auto-scrolling container with exact snapping */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth py-0.5"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        
        {/* SLIDE 1: AC Service Banner (Plumbing Color Theme + Exact Untouched Worker Photo) */}
        <div className="w-full min-w-full shrink-0 snap-center pr-0">
          <div
            className="w-full rounded-[22px] bg-gradient-to-r from-[#C9D6FF] via-[#D8E2FF] to-[#EBF0FF] p-4 sm:p-5 relative min-h-[150px] sm:min-h-[155px] h-[152px] sm:h-[155px] flex flex-col justify-center shadow-[0_4px_16px_rgba(75,110,245,0.08)] border border-white/80 overflow-hidden"
          >
            {/* Untouched AC Technician Photo with smooth gradient blend */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-[52%] sm:w-[50%] h-full pointer-events-none overflow-hidden"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)'
              }}
            >
              <BannerHeroImage
                primarySrc={AC_TECHNICIAN_HERO_IMAGE}
                directSrc={AC_TECHNICIAN_HERO_DIRECT}
                fallbackSrc={AC_TECHNICIAN_HERO_FALLBACK}
                alt="AC Technician"
              />
            </div>

            {/* Content: Left side text and CTA */}
            <div className="relative z-10 max-w-[56%] sm:max-w-[54%] flex flex-col items-start justify-center">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/70 text-[#4B6EF5] text-[10px] font-black uppercase tracking-wider mb-1 border border-white/60">
                <Sparkles className="w-2.5 h-2.5 text-[#4B6EF5]" />
                <span>Seasonal Care</span>
              </div>

              <h3 className="text-xl sm:text-[22px] font-black tracking-tight leading-tight text-[#111827]">
                AC Service
              </h3>

              <p className="text-[11px] font-medium mt-1 leading-snug line-clamp-2 text-slate-600">
                Expert coil cleaning & cooling repairs
              </p>

              <button
                type="button"
                onClick={handleBookAC}
                className={`mt-3 text-[11px] px-4 py-1.5 rounded-full font-bold shadow-sm active:scale-95 transition cursor-pointer inline-flex items-center gap-1.5 ${
                  isAcLive
                    ? 'bg-[#4B6EF5] hover:bg-[#3D5FE0] text-white shadow-[#4B6EF5]/25'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                }`}
              >
                <span>{isAcLive ? 'Book Now' : 'Coming Soon'}</span>
                <ArrowRight className="w-3 h-3 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* SLIDE 2: Coconut Tree Climbing Banner (Pixel-for-Pixel Matching Dimensions, Green Gradient, Prominent Orange CTA) */}
        <div className="w-full min-w-full shrink-0 snap-center pr-0">
          <div
            className="w-full rounded-[22px] bg-gradient-to-r from-[#C6F6D5] via-[#DCFCE7] to-[#ECFDF5] p-4 sm:p-5 relative min-h-[150px] sm:min-h-[155px] h-[152px] sm:h-[155px] flex flex-col justify-center shadow-[0_4px_16px_rgba(5,150,105,0.08)] border border-white/80 overflow-hidden"
          >
            {/* Machine Climber Photo blended seamlessly on right with identical gradient mask */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-[52%] sm:w-[50%] h-full pointer-events-none overflow-hidden"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 28%, black 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 28%, black 100%)'
              }}
            >
              <BannerHeroImage
                primarySrc={COCONUT_HERO_PRIMARY}
                directSrc={COCONUT_HERO_DIRECT}
                fallbackSrc={COCONUT_HERO_FALLBACK}
                alt="Coconut Tree Climber"
              />
            </div>

            {/* Content: Identical padding, typography scale, and layout */}
            <div className="relative z-10 max-w-[56%] sm:max-w-[54%] flex flex-col items-start justify-center">
              {/* Badge: Strictly updated to "Flat ₹99 Visiting & Booking" */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1 shadow-xs border border-amber-300">
                <ShieldCheck className="w-3 h-3 text-slate-950" />
                <span>Flat ₹99 Visiting & Booking</span>
              </div>

              <h3 className="text-xl sm:text-[22px] font-black tracking-tight leading-tight text-[#064E3B]">
                Coconut Tree Climbing
              </h3>

              <p className="text-[11px] font-medium mt-1 leading-snug line-clamp-2 text-emerald-800">
                Machine climbing, cleaning & harvesting
              </p>

              {/* Prominent CTA Button */}
              <button
                type="button"
                onClick={handleBookCoconutClimber}
                className={`mt-3 text-[11px] px-4 py-1.5 rounded-full font-black shadow-sm active:scale-95 transition cursor-pointer inline-flex items-center gap-1.5 ${
                  isCocoLive
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                }`}
              >
                <span>{isCocoLive ? 'Book Now' : 'Coming Soon'}</span>
                <ArrowRight className="w-3 h-3 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* SLIDE 3: Puncher Work Banner (Automobile/Tyre Warm Gradient Theme, Pixel-for-Pixel Matching Dimensions) */}
        <div className="w-full min-w-full shrink-0 snap-center pr-0">
          <div
            className="w-full rounded-[22px] bg-gradient-to-r from-[#FED7AA] via-[#FFEDD5] to-[#FFF7ED] p-4 sm:p-5 relative min-h-[150px] sm:min-h-[155px] h-[152px] sm:h-[155px] flex flex-col justify-center shadow-[0_4px_16px_rgba(234,88,12,0.08)] border border-white/80 overflow-hidden"
          >
            {/* Tyre Technician Photo blended seamlessly on right with identical gradient mask */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-[52%] sm:w-[50%] h-full pointer-events-none overflow-hidden"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 28%, black 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 28%, black 100%)'
              }}
            >
              <BannerHeroImage
                primarySrc={PUNCHER_HERO_PRIMARY}
                directSrc={PUNCHER_HERO_DIRECT}
                fallbackSrc={PUNCHER_HERO_FALLBACK}
                alt="Puncher Work"
              />
            </div>

            {/* Content: Identical padding, typography scale, and layout */}
            <div className="relative z-10 max-w-[56%] sm:max-w-[54%] flex flex-col items-start justify-center">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1 shadow-xs border border-amber-300">
                <ShieldCheck className="w-3 h-3 text-slate-950" />
                <span>Doorstep & Roadside</span>
              </div>

              <h3 className="text-xl sm:text-[22px] font-black tracking-tight leading-tight text-[#7C2D12]">
                Puncher Work
              </h3>

              <p className="text-[11px] font-medium mt-1 leading-snug line-clamp-2 text-amber-900">
                Quick tubeless & tube tyre puncture repairs
              </p>

              {/* Prominent CTA Button */}
              <button
                type="button"
                onClick={handleBookPuncherWork}
                className={`mt-3 text-[11px] px-4 py-1.5 rounded-full font-black shadow-sm active:scale-95 transition cursor-pointer inline-flex items-center gap-1.5 ${
                  isPuncherLive
                    ? 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-[#EA580C]/25'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                }`}
              >
                <span>{isPuncherLive ? 'Book Now' : 'Coming Soon'}</span>
                <ArrowRight className="w-3 h-3 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Pagination dots below carousel with smooth transitions */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <button
          type="button"
          onClick={() => scrollToSlide(0)}
          className={`transition-all duration-300 rounded-full cursor-pointer ${
            activeIdx === 0
              ? 'w-5 h-1.5 bg-[#4B6EF5]'
              : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
          }`}
          title="Slide 1: AC Service"
        />
        <button
          type="button"
          onClick={() => scrollToSlide(1)}
          className={`transition-all duration-300 rounded-full cursor-pointer ${
            activeIdx === 1
              ? 'w-5 h-1.5 bg-orange-500'
              : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
          }`}
          title="Slide 2: Coconut Tree Climbing"
        />
        <button
          type="button"
          onClick={() => scrollToSlide(2)}
          className={`transition-all duration-300 rounded-full cursor-pointer ${
            activeIdx === 2
              ? 'w-5 h-1.5 bg-[#EA580C]'
              : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
          }`}
          title="Slide 3: Puncher Work"
        />
      </div>
    </div>
  );
}

export default MiddleBannerCarousel;
