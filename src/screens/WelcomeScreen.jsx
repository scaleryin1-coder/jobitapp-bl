import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Star } from 'lucide-react';
import file0Asset from '../assets/file-0.png';

export function WelcomeScreen({ onGetStarted, imageSrc }) {
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reference the uploaded file (file-0...png) with seamless fallbacks
  const [imgSrc, setImgSrc] = useState(
    imageSrc || file0Asset || '/file-0.png'
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
          1. HERO IMAGE (ROUGHLY 80% VIEWPORT HEIGHT)
          ======================================================== */}
      <div className="relative w-full h-[76vh] sm:h-[78vh] overflow-hidden bg-slate-50 flex-shrink-0">
        
        {/* Top Overlay Header: JOBit Brand Badge & Skip Button */}
        <div className="absolute top-4 inset-x-0 z-30 flex items-center justify-between px-5 pointer-events-none">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/70 shadow-md">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0EA5E0] to-[#38BDF8] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm tracking-tight text-slate-900">
                JOB<span className="text-[#0EA5E0]">it</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">• Pro</span>
            </div>
          </div>

          <button
            onClick={onGetStarted}
            className="pointer-events-auto text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 hover:bg-white hover:text-[#0EA5E0] transition-all active:scale-95 cursor-pointer shadow-md"
          >
            Skip
          </button>
        </div>

        {/* Hero Image covering ~80% with object-cover for sharp high-quality display */}
        <img
          src={imgSrc}
          alt="Professional Home Services"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (imgSrc !== '/file-0.png') {
              setImgSrc('/file-0.png');
            } else if (imgSrc !== '/welcome-image.jpg') {
              setImgSrc('/welcome-image.jpg');
            } else {
              setImgSrc('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85');
            }
          }}
          className={`w-full h-full object-cover object-top sm:object-center transition-all duration-700 ease-out ${
            imageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-90'
          }`}
        />

        {/* Top subtle vignette for header contrast */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

        {/* Smooth white gradient / fade blend where bottom of photo meets white text area */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />

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
          2. CONTENT & CTA PLACEMENT (CLEAN WHITE BACKGROUND, ELEVATED)
          ======================================================== */}
      <div className="relative flex-1 flex flex-col justify-end px-6 pb-10 sm:pb-12 pt-1 z-20 bg-white text-slate-900">
        
        {/* Headlines & Subtext sitting comfortably above bottom */}
        <div className="mb-5">
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

        {/* Primary Action Button (Blue 'Get Started' button moved higher up) */}
        <button
          onClick={onGetStarted}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_10px_24px_-4px_rgba(14,165,224,0.45)] hover:shadow-[0_14px_28px_-4px_rgba(14,165,224,0.6)] active:scale-[0.98] transition-all cursor-pointer mb-2"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modern Bottom Home Indicator Pill */}
        <div className="w-24 h-1 bg-slate-200 rounded-full mx-auto mt-2" />
      </div>

    </div>
  );
}

export default WelcomeScreen;
