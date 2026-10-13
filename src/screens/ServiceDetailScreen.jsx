import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Share2, 
  ChevronRight,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

export function ServiceDetailScreen({ service, onBack, onBookNow, onOpenChat }) {
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Details' | 'Review' | 'FAQ'
  const [isExpandedAbout, setIsExpandedAbout] = useState(false);

  if (!service) return null;

  return (
    <div className="w-full min-h-screen bg-white pb-28 text-slate-900 select-none">
      
      {/* 1. Top Navigation Bar */}
      <header className="px-5 pt-3 pb-3 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
          {service.categoryName || service.title}
        </h1>

        <button className="w-10 h-10 rounded-full bg-[#F1F3F5] text-slate-800 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition">
          <Bell className="w-4 h-4 stroke-[2.2]" />
        </button>
      </header>

      {/* 2. Navigation Tabs (Overview | Details | Review | FAQ) */}
      <nav className="px-5 flex items-center justify-between border-b border-slate-100 text-xs sm:text-sm font-bold text-slate-400">
        {['Overview', 'Details', 'Review', 'FAQ'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 transition relative ${
                isActive ? 'text-[#0EA5E0]' : 'hover:text-slate-700'
              }`}
            >
              <span>{tab}</span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0EA5E0] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Screen Content */}
      <div className="px-5 pt-4 space-y-4">

        {/* Hero Rounded Image */}
        <div className="w-full h-52 sm:h-60 rounded-[28px] overflow-hidden shadow-sm border border-slate-100 relative">
          <img
            src={service.heroImage || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80"}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Pricing & Rating Info Row */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs sm:text-sm font-black shadow-xs">
              <span>Flat ₹99</span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 block mt-1 leading-tight">
              Inspection & Service Booking
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
              (Fully adjustable from final bill)
            </span>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs sm:text-sm font-extrabold text-slate-900">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{service.rating || 4.9}</span>
              <span className="text-slate-400 font-semibold text-xs">
                ({service.reviewCount || 699} Review)
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              {service.ordersCompleted || 745} Orders Completed
            </p>
          </div>
        </div>

        {/* Green Badge Tagline */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
          <span>{service.badge || "JOBit Verified Expert"}</span>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'Overview' && (
          <div className="space-y-4 pt-1">
            {/* About Service & JOBit Staff */}
            <div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1.5">
                About Service & JOBit Staff
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                {isExpandedAbout
                  ? service.about
                  : `${(service.about || '').slice(0, 160)}...`}
                <button
                  onClick={() => setIsExpandedAbout(!isExpandedAbout)}
                  className="text-[#0EA5E0] font-bold ml-1 hover:underline inline"
                >
                  {isExpandedAbout ? 'Show Less' : 'See More...'}
                </button>
              </p>
            </div>

            {/* Gallery (2-column grid) */}
            <div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2.5">
                Gallery
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(service.gallery || [
                  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=500&q=80",
                  "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=500&q=80"
                ]).map((img, i) => (
                  <div key={i} className="h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm">
                    <img src={img} alt="Job gallery" className="w-full h-full object-cover hover:scale-105 transition" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Details */}
        {activeTab === 'Details' && (
          <div className="space-y-3 pt-1">
            <h3 className="text-base font-extrabold text-slate-900">What's Included</h3>
            <div className="space-y-2">
              {(service.details || [
                "Full diagnostic inspection on site",
                "Repair and standard part replacement labor",
                "Quality testing before sign-off",
                "30-day post service guarantee"
              ]).map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5E0] mt-0.5 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Review */}
        {activeTab === 'Review' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Customer Feedback</h3>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{service.rating} ({service.reviewCount})</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { name: "Rohit Deshmukh", rating: 5, time: "2 days ago", comment: "Arrived right on time and fixed the leak seamlessly. Clean and very professional." },
                { name: "Sneha Patel", rating: 5, time: "1 week ago", comment: "Very polite technician. Transparent pricing and gave useful tips to prevent future clogs." }
              ].map((rev, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{rev.name}</span>
                    <span className="text-[11px] text-slate-400">{rev.time}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[...Array(rev.rating)].map((_, s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: FAQ */}
        {activeTab === 'FAQ' && (
          <div className="space-y-2.5 pt-1">
            <h3 className="text-base font-extrabold text-slate-900">Frequently Asked Questions</h3>
            {(service.faqs || [
              { q: "How are charges calculated?", a: "Fixed standard rate per hour. No hidden travel or surge charges." },
              { q: "Can I reschedule my appointment?", a: "Yes, you can reschedule freely from the Bookings tab up to 2 hours before the start time." }
            ]).map((faq, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#0EA5E0]" />
                  <span>{faq.q}</span>
                </p>
                <p className="text-xs text-slate-500 font-medium pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* 4. Floating Full-Width Gradient "Book Now" Button */}
      <div className="fixed inset-x-0 bottom-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent z-40 max-w-md mx-auto">
        <button
          onClick={() => onBookNow(service)}
          className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-extrabold text-base tracking-tight shadow-[0_12px_28px_-6px_rgba(14,165,224,0.45)] hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
        >
          <span>Book Now</span>
        </button>
      </div>

    </div>
  );
}
