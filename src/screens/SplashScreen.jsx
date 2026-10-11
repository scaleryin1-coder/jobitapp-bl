import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export function SplashScreen({ onGetStarted }) {
  const [progress, setProgress] = useState(0);

  // Auto-transition to Home screen after 2.8s or user can click anytime
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2800;

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
    <div className="relative w-full h-full flex flex-col justify-between bg-white overflow-hidden select-none">
      {/* Top Brand Badge */}
      <div className="absolute top-3 inset-x-0 z-30 flex items-center justify-between px-6 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0EA5E0] to-[#38BDF8] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-white" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-sm tracking-tight text-slate-900">JOB<span className="text-[#0EA5E0]">it</span></span>
            <span className="text-[10px] text-slate-400 font-semibold">• Pro</span>
          </div>
        </div>

        <button
          onClick={onGetStarted}
          className="pointer-events-auto text-[11px] font-bold text-slate-500 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/80 hover:text-[#0EA5E0] hover:bg-white transition cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Hero Visual */}
      <div className="relative w-full h-[58%] overflow-hidden bg-slate-100">
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85"
          alt="Professional Home Service"
          className="w-full h-full object-cover object-top scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white via-white/95 to-transparent" />

        {/* Floating Trust Badge */}
        <div className="absolute bottom-4 left-6 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-card border border-slate-100">
          <ShieldCheck className="w-4 h-4 text-[#0EA5E0]" />
          <span className="text-xs font-bold text-slate-800">100% Verified Experts</span>
        </div>
      </div>

      {/* Bottom Content & CTA */}
      <div className="flex-1 flex flex-col justify-end px-7 pb-8 z-10 bg-white">
        <div className="mb-6">
          <div className="inline-block px-2.5 py-1 mb-2 rounded-full bg-sky-50 text-[#0EA5E0] text-[11px] font-bold">
            Hyperlocal Marketplace
          </div>
          <p className="text-[28px] sm:text-[32px] font-medium text-slate-400 leading-tight">
            Services You
          </p>
          <h2 className="text-[34px] sm:text-[38px] font-extrabold text-slate-900 tracking-tight leading-none mt-1">
            Can Trust!
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
            Instant booking for repairs, deep cleaning, electricians, plumbing and home maintenance with transparent pricing.
          </p>
        </div>

        {/* Progress Bar for Auto-Launch */}
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] transition-all duration-75 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Action Button */}
        <button
          onClick={onGetStarted}
          className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_12px_28px_-6px_rgba(14,165,224,0.45)] hover:opacity-95 active:scale-[0.98] transition cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto mt-5" />
      </div>
    </div>
  );
}
