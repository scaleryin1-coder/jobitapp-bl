import React, { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import acTechnicianImg from '../../assets/images/ac_technician_pro_1791796415312.jpg';
import acUnitImg from '../../assets/images/ac_unit_clean_1791797286325.jpg';
import plumberImg from '../../assets/images/european_plumber_pro_1791797259590.jpg';

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
    },
    {
      id: 'banner_plumb',
      title: 'Plumbing Service',
      subtitle: 'Leak repairs, pipe fitting & maintenance',
      keyword: 'plumb',
      gradient: 'from-[#C9D6FF] via-[#D8E2FF] to-[#EBF0FF]',
      isAcBanner: false,
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
                  BANNER 1: Professional European HVAC Technician Photo 
                  + Clean AC Unit PNG element on right side (Zero text / no typos)
                */}
                {banner.isAcBanner ? (
                  <>
                    {/* Background / Main Photo: European Technician working on AC unit */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-[52%] sm:w-[48%] h-full pointer-events-none overflow-hidden"
                      style={{
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 35%, black 100%)',
                        maskImage: 'linear-gradient(to right, transparent 0%, black 35%, black 100%)'
                      }}
                    >
                      <img
                        src={acTechnicianImg}
                        alt="European AC Technician"
                        className="w-full h-full object-cover object-top"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Clean AC Unit Graphic with Cool Air Stream on Right Side */}
                    <div className="absolute right-2 bottom-1 w-20 h-20 sm:w-22 sm:h-22 pointer-events-none z-10 drop-shadow-sm">
                      <img
                        src={acUnitImg}
                        alt="AC Service Unit"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                  </>
                ) : (
                  /* 
                    BANNER 2: Clean, High-Quality Professional Photograph 
                    of European Plumber working with tools (Zero text / zero typos)
                  */
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-[50%] sm:w-[48%] h-full pointer-events-none overflow-hidden"
                    style={{
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 35%, black 100%)',
                      maskImage: 'linear-gradient(to right, transparent 0%, black 35%, black 100%)'
                    }}
                  >
                    <img
                      src={plumberImg}
                      alt="European Plumber at work"
                      className="w-full h-full object-cover object-top"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* 
                  Clean Text Layout:
                  - Headline and Subtitle only (no redundant extra pills, labels or typos)
                  - Proportioned & centered vertically without unwanted empty spaces
                */}
                <div className="relative z-20 max-w-[58%] sm:max-w-[56%] flex flex-col items-start justify-center">
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
