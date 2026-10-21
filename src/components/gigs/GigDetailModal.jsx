import React, { useState } from 'react';
import { X, Phone, MessageSquare, MapPin, Clock, IndianRupee, Building2, Share2, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export function GigDetailModal({ gig, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !gig) return null;

  const handleShare = async () => {
    const text = `⚡ Urgent Daily Gig: ${gig.title} at ${gig.shop_name} (${gig.location}). Wage: ${gig.wage}. Duration: ${gig.duration}. Contact: ${gig.contact_number}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gig.title} - JOBit Daily Gigs`,
          text: text,
          url: window.location.href
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const cleanWhatsappNumber = (gig.whatsapp_number || gig.contact_number || '').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber.startsWith('91') ? cleanWhatsappNumber : `91${cleanWhatsappNumber}`}?text=${encodeURIComponent(
    `Hello, I am contacting you regarding the "${gig.title}" daily vacancy at ${gig.shop_name} posted on JOBit.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border border-slate-100 max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              gig.urgency === 'urgent'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : gig.urgency === 'today'
                ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {gig.urgency === 'urgent' ? '⚡ Urgent Vacancy' : gig.urgency === 'today' ? '🔥 Today Only' : 'Active Shift'}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-bold text-slate-500">{gig.duration}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              title="Share Vacancy"
              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition active:scale-95 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {gig.title}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
              <span className="font-extrabold text-[#0EA5E0] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {gig.shop_name}
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                {gig.location}
              </span>
            </div>
          </div>

          {/* Wage & Hours Highlight Strip */}
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 text-slate-900 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/70">
                Guaranteed Daily Wage
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight tabular-nums flex items-center">
                {gig.wage}
              </div>
              <span className="text-[11px] font-bold text-emerald-600">Direct Cash / UPI at Shift End</span>
            </div>

            <div className="text-right space-y-0.5 border-l border-amber-200 pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/70">
                Shift Timing
              </span>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>{gig.timing || 'Standard Shift'}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600">{gig.duration}</span>
            </div>
          </div>

          {/* Description & Requirements */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Job Requirements & Scope
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {gig.description || 'Immediate spot placement. Contact the shop manager directly to reserve your shift.'}
            </p>
          </div>

          {/* Safety & Direct Contact Disclaimer */}
          <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0EA5E0] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Zero Platform Commission</p>
              <p className="text-sky-800/90 leading-tight">
                JOBit provides this direct vacancy connection free of charge. Full wages are paid directly to you by the employer.
              </p>
            </div>
          </div>
        </div>

        {/* Dual Primary Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3">
          <a
            href={`tel:${gig.contact_number}`}
            className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>Call Employer</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-white stroke-none" />
            <span>Apply via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
