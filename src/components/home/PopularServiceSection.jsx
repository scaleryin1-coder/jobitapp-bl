import React from 'react';
import { Zap, ArrowUpRight } from 'lucide-react';

export function PopularServiceSection({
  services = [],
  onSelectService,
  onOpenAll
}) {
  // Take the first available popular services (e.g. 2 to 4 services)
  const popularList = services.slice(0, 4);

  return (
    <div className="px-5 pt-3 pb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-[#111827] tracking-tight">
          Popular Service
        </h2>
        <button
          onClick={onOpenAll}
          className="text-xs font-semibold text-[#9CA3AF] hover:text-[#4B6EF5] transition-colors cursor-pointer"
        >
          See all
        </button>
      </div>

      {/* 2-Column Grid of Tall Rounded-3xl Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {popularList.map((service) => (
          <div
            key={service.id}
            onClick={() => onSelectService?.(service)}
            className="h-[210px] sm:h-[230px] rounded-[26px] overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.04)] cursor-pointer group active:scale-[0.98] transition border border-white/60 bg-white"
          >
            {/* Full Background Image */}
            <img
              src={service.heroImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80'}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';
              }}
            />

            {/* Bottom Frosted-Glass Strip */}
            <div className="absolute inset-x-2 bottom-2 bg-white/70 backdrop-blur-md rounded-2xl p-2.5 shadow-sm border border-white/80 flex items-center justify-between gap-1.5 transition-all">
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
                className="w-8 h-8 rounded-full bg-[#4B6EF5] group-hover:bg-[#3D5FE0] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition cursor-pointer"
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
