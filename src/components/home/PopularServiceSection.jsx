import React from 'react';
import { Zap, ArrowUpRight } from 'lucide-react';

// Exact 4 Popular Services configured with European professionals in neat blue work uniforms
const POPULAR_SERVICES_CONFIG = [
  {
    key: 'ac',
    title: 'AC Service',
    categoryName: 'AC Service',
    categoryId: 'cat_ac',
    defaultPrice: 450,
    // European technician wearing a blue uniform servicing a modern split AC unit
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    match: (s) => (s.categoryName + ' ' + s.title + ' ' + (s.categoryId || '')).toLowerCase().includes('ac')
  },
  {
    key: 'driver',
    title: 'Driver',
    categoryName: 'Driver',
    categoryId: 'cat_car',
    defaultPrice: 399,
    // Professional chauffeur/driver wearing a neat dark blue uniform next to a modern car
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
    match: (s) => (s.categoryName + ' ' + s.title).toLowerCase().includes('driver') || (s.categoryName + ' ' + s.title).toLowerCase().includes('chauffeur')
  },
  {
    key: 'garden',
    title: 'Garden & Outdoor Work',
    categoryName: 'Garden & Outdoor Work',
    categoryId: 'cat_garden',
    defaultPrice: 399,
    // European gardener in blue work overalls working in a bright outdoor garden space
    image: 'https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&w=800&q=80',
    match: (s) => (s.categoryName + ' ' + s.title).toLowerCase().includes('garden')
  },
  {
    key: 'electrician',
    title: 'Electrician',
    categoryName: 'Electrician',
    categoryId: 'cat_electrician',
    defaultPrice: 320,
    // European electrician wearing a blue uniform with safety gear inspecting an electrical circuit panel
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
    match: (s) => (s.categoryName + ' ' + s.title).toLowerCase().includes('elect')
  }
];

export function PopularServiceSection({
  services = [],
  onSelectService,
  onOpenAll
}) {
  // Construct the exact 4 popular services matching with dynamic data or fallbacks
  const popularList = POPULAR_SERVICES_CONFIG.map((cfg) => {
    const existing = (services || []).find(cfg.match);

    return {
      id: existing?.id || `serv_popular_${cfg.key}`,
      title: cfg.title,
      categoryName: cfg.categoryName,
      categoryId: existing?.categoryId || cfg.categoryId,
      price: existing?.price || cfg.defaultPrice,
      rating: existing?.rating || 4.9,
      reviewCount: existing?.reviewCount || 190,
      heroImage: cfg.image,
      imageUrl: cfg.image,
      image: cfg.image,
      subCategories: existing?.subCategories || [
        `${cfg.title} Inspection & Diagnostics`,
        `${cfg.title} Standard Service & Maintenance`
      ],
      about: existing?.about || `Professional, verified ${cfg.title} delivered by certified European technicians in neat blue uniforms with high-precision equipment.`
    };
  });

  return (
    <div className="w-full max-w-full px-5 pt-3 pb-8 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-[#111827] tracking-tight">
          Popular Service
        </h2>
        <button
          onClick={onOpenAll}
          className="text-xs font-semibold text-[#9CA3AF] hover:text-[#0EA5E0] transition-colors cursor-pointer"
        >
          See all
        </button>
      </div>

      {/* 2-Column Grid of exactly 4 Cards with consistent aspect ratio & 16px border-radius */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 w-full">
        {popularList.map((service) => (
          <div
            key={service.id}
            onClick={() => onSelectService?.(service)}
            className="group relative w-full min-w-0 aspect-[4/5] rounded-[16px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.05)] cursor-pointer active:scale-[0.98] transition-all duration-200 border border-slate-100 bg-slate-100"
            style={{
              borderRadius: '16px',
              isolation: 'isolate',
              WebkitMaskImage: '-webkit-radial-gradient(white, black)' // Fixes WebKit border-radius clipping bug
            }}
          >
            {/* Dedicated Fully-Constrained Responsive Image Container */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-[16px]"
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '16px',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            >
              <img
                src={service.heroImage}
                alt={service.title}
                className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500 rounded-[16px]"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  display: 'block'
                }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* Bottom Frosted-Glass Strip */}
            <div 
              className="absolute inset-x-2 bottom-2 z-10 bg-white/85 backdrop-blur-md p-2.5 shadow-sm border border-white/90 flex items-center justify-between gap-1.5 transition-all"
              style={{ borderRadius: '12px' }}
            >
              {/* Price & Service Name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 leading-none">
                  <Zap className="w-3 h-3 text-slate-800 fill-slate-800 shrink-0" />
                  <span className="truncate">From ₹{service.price}</span>
                </div>
                <p className="text-xs font-black text-[#111827] truncate mt-1 leading-tight">
                  {service.title}
                </p>
              </div>

              {/* Round Blue Button with Arrow Up Right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectService?.(service);
                }}
                className="w-8 h-8 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition cursor-pointer"
                title={`View ${service.title}`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
