import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * AC Service Banner Hero Worker Photo
 * Retains the exact worker photo untouched from the original specification:
 * Primary: "https://kommodo.ai/i/6x5oOPsxxTObOhMuPqNT"
 * Direct CDN: "https://plain-apac-prod-public.komododecks.com/202610/13/6x5oOPsxxTObOhMuPqNT/image.png"
 * Curated Fallback: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"
 */
const AC_TECHNICIAN_HERO_IMAGE = 'https://kommodo.ai/i/6x5oOPsxxTObOhMuPqNT';
const AC_TECHNICIAN_HERO_DIRECT = 'https://plain-apac-prod-public.komododecks.com/202610/13/6x5oOPsxxTObOhMuPqNT/image.png';
const AC_TECHNICIAN_HERO_FALLBACK = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80';

export function AcServiceBanner({ services = [], onSelectService, onBookService }) {
  const [imgSrc, setImgSrc] = useState(AC_TECHNICIAN_HERO_IMAGE);

  const handleImageError = () => {
    if (imgSrc === AC_TECHNICIAN_HERO_IMAGE) {
      setImgSrc(AC_TECHNICIAN_HERO_DIRECT);
    } else if (imgSrc !== AC_TECHNICIAN_HERO_FALLBACK) {
      setImgSrc(AC_TECHNICIAN_HERO_FALLBACK);
    }
  };

  const handleBook = () => {
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

  return (
    <div className="w-full px-5 py-2.5">
      {/* 
        Middle Banner:
        - Positioned right AFTER the Service Categories grid and BEFORE the Popular Services list
        - Styled with the Plumbing Service background color theme (soft periwinkle/ice blue gradient)
        - Exact untouched AC Technician worker photo on right with gradient blending mask
      */}
      <div
        className="w-full rounded-[22px] bg-gradient-to-r from-[#C9D6FF] via-[#D8E2FF] to-[#EBF0FF] p-4 sm:p-5 relative min-h-[145px] sm:min-h-[150px] flex flex-col justify-center shadow-[0_4px_16px_rgba(75,110,245,0.08)] border border-white/80 overflow-hidden"
      >
        {/* Exact Untouched AC Worker Photo on right side with smooth gradient blend */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-[52%] sm:w-[50%] h-full pointer-events-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)'
          }}
        >
          <img
            src={imgSrc}
            onError={handleImageError}
            alt="AC Technician"
            className="w-full h-full object-cover object-center"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Clean, High-Contrast Text Layout & CTA */}
        <div className="relative z-10 max-w-[56%] sm:max-w-[54%] flex flex-col items-start justify-center">
          
          {/* Subtle Tagline */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 text-[#4B6EF5] text-[10px] font-black uppercase tracking-wider mb-1 border border-white/60">
            <Sparkles className="w-2.5 h-2.5 text-[#4B6EF5]" />
            <span>Seasonal Care</span>
          </div>

          {/* Clean Headline (Plumbing Theme Dark Typography) */}
          <h3 className="text-xl sm:text-[22px] font-black tracking-tight leading-tight text-[#111827]">
            AC Service
          </h3>

          {/* Subtitle with High Readability */}
          <p className="text-[11px] font-medium mt-1 leading-snug line-clamp-2 text-slate-600">
            Expert coil cleaning & cooling repairs
          </p>

          {/* Clean Modern "Book Now" CTA Button (Plumbing Theme Solid Royal Blue) */}
          <button
            type="button"
            onClick={handleBook}
            className="mt-3 text-[11px] px-4 py-1.5 rounded-full bg-[#4B6EF5] hover:bg-[#3D5FE0] text-white font-bold shadow-sm shadow-[#4B6EF5]/25 active:scale-95 transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3 h-3 text-white stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AcServiceBanner;
