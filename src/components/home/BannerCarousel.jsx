import React, { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Hero Banner Image Configuration
 * Strictly uses direct HTTPS remote URLs without any local asset imports.
 * 1. Plumber Image: "https://kommodo.ai/i/XN7OWOsw0pYT1qhA9r6o"
 * 2. AC Technician Image: "https://kommodo.ai/i/6x5oOPsxxTObOhMuPqNT"
 */
const PLUMBER_HERO_IMAGE = 'https://kommodo.ai/i/XN7OWOsw0pYT1qhA9r6o';
const PLUMBER_HERO_DIRECT = 'https://plain-apac-prod-public.komododecks.com/202610/13/XN7OWOsw0pYT1qhA9r6o/image.png';
const PLUMBER_HERO_FALLBACK = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80';

const AC_TECHNICIAN_HERO_IMAGE = 'https://kommodo.ai/i/6x5oOPsxxTObOhMuPqNT';
const AC_TECHNICIAN_HERO_DIRECT = 'https://plain-apac-prod-public.komododecks.com/202610/13/6x5oOPsxxTObOhMuPqNT/image.png';
const AC_TECHNICIAN_HERO_FALLBACK = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80';

/**
 * Resilient Image renderer that loads the primary HTTPS link,
 * gracefully falling back to direct asset CDN or curated unplash fallback
 * if the share page returns text/html.
 */
function BannerHeroImage({
  primarySrc,
  directSrc,
  fallbackSrc,
  alt,
  className = '',
  style = {}
}) {
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
      className={className}
      loading="eager"
      decoding="async"
      style={style}
    />
  );
}

export function BannerCarousel({
  banners = [],
  services = [],
  onSelectService
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);

  // Sync scroll position with activeIdx
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const idx = Math.round(scrollLeft / clientWidth);
    if (idx >= 0 && idx < bannerList.length && idx !== activeIdx) {
      setActiveIdx(idx);
    }
  };

  const scrollToIdx = (idx) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth'
    });
    setActiveIdx(idx);
  };

  const handleBookService = (keyword = 'ac') => {
    const term = keyword.toLowerCase();
    const matched = (services || []).find(s => 
      (s?.title && s.title.toLowerCase().includes(term)) ||
      (s?.categoryName && s.categoryName.toLowerCase().includes(term)) ||
      (s?.categoryId && s.categoryId.toLowerCase().includes(term))
    ) || (services && services[0]);

    if (matched) {
      onSelectService?.(matched);
    }
  };

  const bannerList = [
    {
      id: 'banner_ac',
      title: 'AC Service',
      subtitle: 'Expert coil cleaning & cooling repairs',
      keyword: 'ac',
      gradient: 'from-[#BFF5E3] via-[#D3F8EE] to-[#E6FCF5]',
      isAcBanner: true,
      imagePrimary: AC_TECHNICIAN_HERO_IMAGE,
      imageDirect: AC_TECHNICIAN_HERO_DIRECT,
      imageFallback: AC_TECHNICIAN_HERO_FALLBACK,
      alt: 'AC Technician'
    },
    {
      id: 'banner_plumb',
      title: 'Plumbing Service',
      subtitle: 'Leak repairs, pipe fitting & maintenance',
      keyword: 'plumb',
      gradient: 'from-[#C9D6FF] via-[#D8E2FF] to-[#EBF0FF]',
      isAcBanner: false,
      imagePrimary: PLUMBER_HERO_IMAGE,
      imageDirect: PLUMBER_HERO_DIRECT,
      imageFallback: PLUMBER_HERO_FALLBACK,
      alt: 'Plumber'
    }
  ];

  return (
    <div className="w-full px-5 pt-2 pb-1">
      {/* 
        Single Full-Width Card Carousel:
        - Exact original height (min-h-[145px]) and padding (p-4)
        - 1st Banner takes 100% of container width
        - 2nd Banner is completely straight and hidden out of view initially
        - Smoothly snaps & slides into view when swiped horizontally
      */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth py-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {bannerList.map((banner) => {
          return (
            <div
              key={banner.id}
              className="w-full min-w-full shrink-0 snap-center"
            >
              <div
                className={`w-full rounded-[22px] bg-gradient-to-r ${banner.gradient} p-4 relative min-h-[145px] sm:min-h-[150px] flex flex-col justify-center shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-white/70 overflow-hidden`}
              >
                {/* 
                  Hero Banner Graphic seamlessly blended on right side:
                  - Smooth gradient fade mask into background
                  - Full object-cover presentation
                  - Zero local file imports
                */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-[52%] sm:w-[50%] h-full pointer-events-none overflow-hidden"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
                    maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)'
                  }}
                >
                  <BannerHeroImage
                    primarySrc={banner.imagePrimary}
                    directSrc={banner.imageDirect}
                    fallbackSrc={banner.imageFallback}
                    alt={banner.alt}
                    className="w-full h-full object-cover object-center"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* 
                  Clean Text Layout:
                  - Headline and Subtitle preserved exactly
                  - Responsive proportions and clear hierarchy
                */}
                <div className="relative z-20 max-w-[56%] sm:max-w-[54%] flex flex-col items-start justify-center">
                  {/* Clean Headline */}
                  <h3 className="text-xl sm:text-[22px] font-black text-[#111827] tracking-tight leading-tight">
                    {banner.title}
                  </h3>

                  {/* Clean Concise Subtitle */}
                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug line-clamp-2">
                    {banner.subtitle}
                  </p>

                  {/* Book Now Button */}
                  <button
                    onClick={() => handleBookService(banner.keyword)}
                    className="mt-3 bg-[#4B6EF5] hover:bg-[#3D5FE0] text-white font-bold text-[11px] px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Small Pagination Dots Below */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {bannerList.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIdx(i)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              i === activeIdx
                ? 'w-4 h-1.5 bg-[#4B6EF5]'
                : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
            }`}
            title={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default BannerCarousel;
