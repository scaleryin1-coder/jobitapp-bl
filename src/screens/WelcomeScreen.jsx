import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Star } from 'lucide-react';
import welcomeImgAsset from '../assets/welcome-image.jpg';

export function WelcomeScreen({ onGetStarted }) {
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(welcomeImgAsset || '/welcome-image.jpg');

  // Auto-launch progress bar (3.5s) with ability to tap 'Get Started' or 'Skip' anytime
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
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between bg-slate-950 overflow-hidden select-none">
      
      {/* ========================================================
          1. HERO IMAGE (APPROXIMATELY 80% VIEWPORT HEIGHT)
          ======================================================== */}
      <div className="relative w-full h-[78vh] sm:h-[80%] overflow-hidden bg-slate-900 flex-shrink-0">
        
        {/* Top Overlay Header: JOBit Brand Badge & Skip Button */}
        <div className="absolute top-4 inset-x-0 z-30 flex items-center justify-between px-5 pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0EA5E0] to-[#38BDF8] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm tracking-tight text-white">
                JOB<span className="text-[#38BDF8]">it</span>
              </span>
              <span className="text-[10px] text-sky-200/80 font-semibold">• Pro</span>
            </div>
          </div>

          <button
            onClick={onGetStarted}
            className="pointer-events-auto text-xs font-bold text-white/90 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 hover:bg-white hover:text-slate-900 transition-all active:scale-95 cursor-pointer shadow-md"
          >
            Skip
          </button>
        </div>

        {/* Hero Image covering upper & central viewport */}
        <img
          src={imgSrc}
          alt="Professional Home Services"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (imgSrc !== '/welcome-image.jpg') {
              setImgSrc('/welcome-image.jpg');
            } else {
              setImgSrc('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85');
            }
          }}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            imageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-90'
          }`}
        />

        {/* Cinematic Vignette & Bottom Blend Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/30 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none" />

        {/* Floating Trust Pill Badge over Image */}
        <div className="absolute bottom-6 left-5 z-20 flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 shadow-xl">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-extrabold text-white">100% Verified Pros</span>
              <div className="flex items-center text-amber-400 text-[10px]">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                <span className="ml-0.5 font-bold">4.9</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">Background-checked & trained</p>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CONTENT & CTA PLACEMENT (BOTTOM ~20% VIEWPORT)
          ======================================================== */}
      <div className="relative flex-1 flex flex-col justify-end px-6 pb-6 pt-2 z-20 bg-slate-950 text-white">
        
        {/* Headlines & Subtext */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-full bg-sky-500/20 text-[#38BDF8] border border-sky-400/30 text-[10px] font-bold tracking-wide uppercase">
            <span>Hyperlocal Marketplace</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-white leading-tight">
            Services You <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8]">Can Trust!</span>
          </h1>

          <p className="text-xs text-slate-400 font-normal mt-1 leading-relaxed line-clamp-2">
            Instant booking for AC repair, deep cleaning, electricians, plumbing & maintenance with upfront prices.
          </p>
        </div>

        {/* Auto-advance Progress Line */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] transition-all duration-75 ease-out rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Primary Action Button (Blue 'Get Started' button) */}
        <button
          onClick={onGetStarted}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_-4px_rgba(14,165,224,0.55)] hover:shadow-[0_12px_28px_-4px_rgba(14,165,224,0.7)] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modern Home Indicator Pill */}
        <div className="w-24 h-1 bg-white/20 rounded-full mx-auto mt-3" />
      </div>

    </div>
  );
}

export default WelcomeScreen;
