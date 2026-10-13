import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function PromotionalHeroBanner({ onBookNow, onExploreServices }) {
  return (
    <div className="w-full px-5 pt-3 pb-2">
      <div 
        className="w-full rounded-[24px] bg-gradient-to-br from-[#071739] via-[#0D2A5E] to-[#1E3A8A] p-4 sm:p-5 relative overflow-hidden shadow-[0_8px_24px_rgba(13,42,94,0.25)] border border-blue-900/40 text-white"
      >
        {/* Decorative background glow & accent blurs */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#0EA5E0]/20 rounded-full blur-xl pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10">
          
          {/* Top Tagline Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Limited Period Offer</span>
          </div>

          {/* Banner Title */}
          <h2 className="text-lg sm:text-[21px] font-black text-white leading-tight tracking-tight">
            <span className="text-amber-400">Flat ₹99</span> Inspection & Service Booking
          </h2>

          {/* Banner Subtitle */}
          <p className="text-xs sm:text-[12.5px] text-blue-100 font-medium leading-relaxed mt-1.5 max-w-sm">
            All Services Available for Visit & Checkup at Just <span className="text-yellow-300 font-bold">₹99!</span> (Fully adjustable from final bill)
          </p>

          {/* Guarantee Highlights */}
          <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2 border-t border-white/10 text-[11px] text-blue-200">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>100% Adjustable in Bill</span>
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Doorstep Visit Included</span>
            </span>
          </div>

          {/* Action CTAs: "Book Now" & "Explore Services" */}
          <div className="flex items-center gap-2.5 mt-3.5">
            <button
              type="button"
              onClick={() => onBookNow?.()}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => onExploreServices?.()}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              Explore Services
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PromotionalHeroBanner;
