import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Star } from 'lucide-react';
import jobitLogoImg from '../assets/images/jobit_logo_1792387626740.jpg';

const WELCOME_HERO_IMAGE_URL = 'https://i.imgur.com/1OViWYh.png';

export function WelcomeScreen({ onGetStarted, imageSrc }) {
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Strictly use the specified Image URL as primary source
  const [imgSrc, setImgSrc] = useState(
    imageSrc || WELCOME_HERO_IMAGE_URL
  );

  // Auto-launch progress bar (3.5s) while allowing user to tap 'Get Started' or 'Skip' anytime
  useEffect(() => {
    const startTime = Date.now();
    const duration = 3500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        onGetStarted?.();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onGetStarted]);

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between bg-white overflow-hidden select-none">
      
      {/* ========================================================
          1. HERO IMAGE (75% - 80% UPPER SCREEN SPACE)
          ======================================================== */}
      <div className="relative w-full h-[76vh] sm:h-[78vh] overflow-hidden bg-slate-50 flex-shrink-0">
        
        {/* Top Overlay Header: JOBit Brand Badge & Skip Button */}
        <div 
          style={{ top: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
          className="absolute inset-x-0 z-30 flex items-center justify-between px-5 pointer-events-none"
        >
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200/80 shadow-md">
            <img
              src={jobitLogoImg}
              alt="JOBit - Reliable Service Partner"
              className="h-8 sm:h-9 w-auto max-w-[170px] object-contain"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/jobit_logo_1792387626740.jpg';
              }}
            />
          </div>

          <button
            onClick={onGetStarted}
            className="pointer-events-auto text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 hover:bg-white hover:text-[#D32F2F] transition-all active:scale-95 cursor-pointer shadow-md"
          >
            Skip
          </button>
        </div>

        {/* Hero Image covering 75-80% with object-cover for crisp, high-quality presentation */}
        <img
          src={imgSrc}
          alt="Professional Home Services"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            // Local fallback if remote image has network issues
            if (imgSrc === WELCOME_HERO_IMAGE_URL) {
              setImgSrc('/welcome-hero.png');
            } else if (imgSrc !== '/file-0.png') {
              setImgSrc('/file-0.png');
            }
          }}
          className={`w-full h-full object-cover object-top sm:object-center transition-all duration-700 ease-out ${
            imageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-90'
          }`}
        />

        {/* Top subtle vignette for header contrast */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

        {/* Smooth white gradient / fade blend where bottom of photo meets clean white text area */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none" />

        {/* Floating Verified Trust Pill Badge over Image */}
        <div className="absolute bottom-8 left-5 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-100 shadow-card">
          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-extrabold text-slate-900">100% Verified Pros</span>
              <div className="flex items-center text-amber-500 text-[10px]">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                <span className="ml-0.5 font-bold">4.9</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Background-checked & trained</p>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CONTENT & CTA PLACEMENT (CLEAN WHITE BACKGROUND, LIFTED HIGHER: pb-16)
          ======================================================== */}
      <div className="relative flex-1 flex flex-col justify-end px-6 pb-16 pt-2 z-20 bg-white text-slate-900">
        
        {/* Headlines & Subtext sitting comfortably above bottom edge */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2 rounded-full bg-sky-50 text-[#0EA5E0] border border-sky-100 text-[10px] font-bold tracking-wide uppercase">
            <span>Hyperlocal Marketplace</span>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight">
            Services You <span className="text-[#0EA5E0]">Can Trust!</span>
          </h1>

          <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5 leading-relaxed line-clamp-2">
            Instant booking for AC repair, deep cleaning, electricians, plumbing & maintenance with upfront prices.
          </p>
        </div>

        {/* Auto-advance Progress Line */}
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] transition-all duration-75 ease-out rounded-full shadow-[0_0_8px_rgba(14,165,224,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Primary Action Button (Blue 'Get Started' button lifted higher with pb-16) */}
        <button
          onClick={onGetStarted}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_10px_24px_-4px_rgba(14,165,224,0.45)] hover:shadow-[0_14px_28px_-4px_rgba(14,165,224,0.6)] active:scale-[0.98] transition-all cursor-pointer mb-3"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modern Bottom Home Indicator Pill with comfortable spacing */}
        <div className="w-24 h-1 bg-slate-200 rounded-full mx-auto" />
      </div>

    </div>
  );
}

export default WelcomeScreen;
