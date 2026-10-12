import React, { useRef, useState, useEffect } from 'react';

const BANNER_THEMES = [
  {
    // Banner 1: Soft mint-green gradient
    gradient: 'from-[#BFF5E3] via-[#D0F8EC] to-[#DDFBF1]',
    defaultDiscount: '45% OFF',
    tilt: '',
  },
  {
    // Banner 2: Soft periwinkle/light purple-blue gradient, slightly tilted
    gradient: 'from-[#C9D6FF] via-[#D4DCFF] to-[#DCE4FF]',
    defaultDiscount: '35% OFF',
    tilt: 'rotate-[1.2deg] sm:rotate-[1.5deg]',
  },
  {
    // Banner 3: Soft peach/warm yellow gradient
    gradient: 'from-[#FFE5D9] via-[#FEEBDE] to-[#FFF3E8]',
    defaultDiscount: '25% OFF',
    tilt: '',
  }
];

export function BannerCarousel({
  banners = [],
  services = [],
  onSelectService
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);

  // If banners array is empty, provide a clean fallback with existing data format
  const displayBanners = banners && banners.length > 0 ? banners : [
    {
      id: 'banner_1',
      title: '45% OFF',
      subtitle: 'Exclusive discounts on home service',
      serviceName: 'Home Repair',
      price: 300,
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 'banner_2',
      title: '35% OFF',
      subtitle: 'Exclusive discounts on home service',
      serviceName: 'AC Servicing',
      price: 499,
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80'
    }
  ];

  // Sync scroll position with activeIdx
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const idx = Math.round(scrollLeft / (clientWidth * 0.85));
    if (idx >= 0 && idx < displayBanners.length) {
      setActiveIdx(idx);
    }
  };

  const scrollToIdx = (idx) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth * 0.85;
    scrollRef.current.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth'
    });
    setActiveIdx(idx);
  };

  const handleBookNow = (banner) => {
    // Find matching service from services data or pick the first available
    const serviceName = (banner?.serviceName || banner?.title || '').toLowerCase();
    const matched = services.find(s => 
      s?.title?.toLowerCase().includes(serviceName) ||
      s?.categoryName?.toLowerCase().includes(serviceName)
    ) || services[0];

    if (matched) {
      onSelectService?.(matched);
    }
  };

  return (
    <div className="px-5 pt-2 pb-2">
      {/* Horizontal Swipeable Carousel (Next card peeks from right) */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-5 px-5 scroll-smooth py-2"
      >
        {displayBanners.map((banner, index) => {
          const theme = BANNER_THEMES[index % BANNER_THEMES.length];
          const discountTitle = banner.title?.includes('%') 
            ? banner.title 
            : (theme.defaultDiscount || banner.title);
          const descriptionText = banner.subtitle || "Exclusive discounts on home service";

          return (
            <div
              key={banner.id || index}
              className={`w-[84%] sm:w-[350px] shrink-0 snap-start rounded-[28px] bg-gradient-to-r ${theme.gradient} p-5 relative min-h-[160px] flex flex-col justify-between shadow-[0_6px_20px_rgba(0,0,0,0.03)] border border-white/60 transition-transform duration-300 ${theme.tilt} overflow-hidden`}
            >
              {/* Right Side: Existing Banner Image Cleanly Positioned */}
              <div className="absolute right-0 bottom-0 h-full w-[44%] max-w-[155px] pointer-events-none flex items-end justify-end">
                <img
                  src={banner.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=500&q=80'}
                  alt={banner.serviceName || banner.title}
                  className="h-[95%] max-h-[150px] object-cover object-top drop-shadow-sm rounded-br-[28px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Left Side: Offer text, description, Book Now button */}
              <div className="relative z-10 max-w-[60%] flex flex-col items-start">
                <h3 className="text-2xl font-black text-[#111827] tracking-tight leading-none">
                  {discountTitle}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1.5 leading-snug line-clamp-2">
                  {descriptionText}
                </p>

                {/* Blue rounded "Book Now" pill button */}
                <button
                  onClick={() => handleBookNow(banner)}
                  className="mt-4 bg-[#4B6EF5] hover:bg-[#3D5FE0] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm active:scale-95 transition cursor-pointer inline-flex items-center justify-center"
                >
                  Book Now
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Small Pagination Dots Below */}
      {displayBanners.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {displayBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIdx(i)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                i === activeIdx
                  ? 'w-5 h-1.5 bg-[#4B6EF5]'
                  : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
