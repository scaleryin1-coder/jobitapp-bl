import React from 'react';
import { 
  CalendarClock, 
  UserCheck, 
  ShieldCheck, 
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
      className={`w-full py-2.5 px-2 my-2 border-y border-slate-200/70 bg-slate-50/50 select-none ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Fixed 4-column compact row without any horizontal scroll */}
        <div className="flex items-center justify-between w-full">
          {HIGHLIGHT_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {/* Vertical Stack: Icon on top, Text below */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-0.5 py-0.5 group cursor-default">
                  {/* Compact Monochrome Outline Icon Tile */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-center mb-1 group-hover:border-slate-300 transition-all shrink-0">
                    <Icon 
                      className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-500 group-hover:text-slate-700 stroke-[1.7] transition-colors shrink-0" 
                      aria-hidden="true"
                    />
                  </div>

                  {/* Compact 2-Line Bold Uppercase Text */}
                  <div className="text-[8.5px] sm:text-[9.5px] md:text-[10.5px] font-black text-slate-500 group-hover:text-slate-700 tracking-tight uppercase leading-[1.15] transition-colors max-w-[76px] sm:max-w-none">
                    <span className="block truncate">{item.line1}</span>
                    <span className="block truncate">{item.line2}</span>
                  </div>
                </div>

                {/* Subtle Gray Dot Divider between items */}
                {idx < HIGHLIGHT_ITEMS.length - 1 && (
                  <span 
                    className="w-1 h-1 rounded-full bg-slate-300 shrink-0 self-center opacity-70" 
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
