import React from 'react';
import { 
  CalendarClock, 
  UserCheck, 
  ShieldCheck, 
  BadgePercent, 
  CreditCard 
} from 'lucide-react';

const HIGHLIGHT_ITEMS = [
  {
    id: 'scheduled',
    icon: CalendarClock,
    line1: 'ON DEMAND /',
    line2: 'SCHEDULED'
  },
  {
    id: 'verified',
    icon: UserCheck,
    line1: 'VERIFIED',
    line2: 'PARTNERS'
  },
  {
    id: 'warranty',
    icon: ShieldCheck,
    line1: 'SERVICE',
    line2: 'WARRANTY'
  },
  {
    id: 'pricing',
    icon: BadgePercent,
    line1: 'TRANSPARENT',
    line2: 'PRICING'
  },
  {
    id: 'payments',
    icon: CreditCard,
    line1: 'ONLINE',
    line2: 'PAYMENTS'
  }
];

export function FeatureHighlightsBar({ className = '' }) {
  return (
    <section 
      aria-label="Platform Highlights & Trust Guarantees"
      className={`w-full py-6 mt-4 mb-2 border-y border-slate-200/90 bg-slate-50/70 overflow-hidden select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Horizontal scrollable track with vertical stacked items */}
        <div className="flex items-center gap-1 sm:gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth justify-start sm:justify-center py-1">
          {HIGHLIGHT_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {/* Vertical Stack: Icon on top, Text below */}
                <div className="flex flex-col items-center justify-center text-center shrink-0 min-w-[115px] sm:min-w-[135px] md:min-w-[150px] px-2 py-1 group cursor-default">
                  {/* Prominent Outline Icon */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-center mb-2.5 group-hover:border-slate-300 group-hover:shadow-xs transition-all">
                    <Icon 
                      className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-slate-500 group-hover:text-slate-700 stroke-[1.6] transition-colors shrink-0" 
                      aria-hidden="true"
                    />
                  </div>

                  {/* Balanced 2-Line Bold Uppercase Text */}
                  <div className="text-[11px] sm:text-[11.5px] font-black text-slate-500 group-hover:text-slate-700 tracking-wider uppercase leading-tight transition-colors">
                    <span className="block">{item.line1}</span>
                    <span className="block">{item.line2}</span>
                  </div>
                </div>

                {/* Subtle Gray Dot Divider between items */}
                {idx < HIGHLIGHT_ITEMS.length - 1 && (
                  <span 
                    className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mx-1 sm:mx-2 self-center opacity-75" 
                    aria-hidden="true" 
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeatureHighlightsBar;
