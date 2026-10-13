import React, { useState } from 'react';
import { Zap, ArrowUpRight } from 'lucide-react';

/**
 * Structured Data Specification for "Popular Services"
 * Strictly uses remote image URLs directly without any local file imports.
 * 1. Title: AC Technician  | Image URL: https://kommodo.ai/i/410CrPRmc9hsuyX0Eb4d
 * 2. Title: Lawn & Garden  | Image URL: https://kommodo.ai/i/Wh1T3p3vwgl9o8sLMgZE
 * 3. Title: Electrician    | Image URL: https://kommodo.ai/i/21VGnAa5VQ7rZ5Vr4l5H
 * 4. Title: Driver         | Image URL: https://kommodo.ai/i/uC1hWGiPT0QP7yVLWILJ
 */
export const POPULAR_SERVICES_DATA = [
  {
    id: 'serv_ac_technician',
    title: 'AC Technician',
    imageUrl: 'https://kommodo.ai/i/410CrPRmc9hsuyX0Eb4d',
    image: 'https://kommodo.ai/i/410CrPRmc9hsuyX0Eb4d',
    directImageUrl: 'https://plain-apac-prod-public.komododecks.com/202610/13/410CrPRmc9hsuyX0Eb4d/image.png',
    fallbackUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    categoryName: 'AC Service',
    categoryId: 'cat_ac',
    price: 450,
    rating: 4.9,
    reviewCount: 230,
    ordersCompleted: 450,
    badge: 'Certified HVAC Specialist',
    about: 'Professional AC maintenance, deep chemical jet service, cooling diagnosis, and gas leak repair by verified technicians.',
    match: (s) => {
      const text = `${s?.categoryName || ''} ${s?.title || ''} ${s?.categoryId || ''}`.toLowerCase();
      return text.includes('ac') || text.includes('air condition') || text.includes('technician');
    }
  },
  {
    id: 'serv_lawn_and_garden',
    title: 'Lawn & Garden',
    imageUrl: 'https://kommodo.ai/i/Wh1T3p3vwgl9o8sLMgZE',
    image: 'https://kommodo.ai/i/Wh1T3p3vwgl9o8sLMgZE',
    directImageUrl: 'https://plain-apac-prod-public.komododecks.com/202610/13/Wh1T3p3vwgl9o8sLMgZE/image.png',
    fallbackUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Garden & Outdoor Work',
    categoryId: 'cat_garden',
    price: 399,
    rating: 4.9,
    reviewCount: 220,
    ordersCompleted: 410,
    badge: 'Horticulture Specialist',
    about: 'Lawn mowing, hedge trimming, weed removal, organic soil fertilization, and drip irrigation setup.',
    match: (s) => {
      const text = `${s?.categoryName || ''} ${s?.title || ''} ${s?.categoryId || ''}`.toLowerCase();
      return text.includes('garden') || text.includes('lawn');
    }
  },
  {
    id: 'serv_electrician',
    title: 'Electrician',
    imageUrl: 'https://kommodo.ai/i/21VGnAa5VQ7rZ5Vr4l5H',
    image: 'https://kommodo.ai/i/21VGnAa5VQ7rZ5Vr4l5H',
    directImageUrl: 'https://plain-apac-prod-public.komododecks.com/202610/13/21VGnAa5VQ7rZ5Vr4l5H/image.png',
    fallbackUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Electrician',
    categoryId: 'cat_electrician',
    price: 320,
    rating: 4.8,
    reviewCount: 198,
    ordersCompleted: 580,
    badge: 'Licensed Electrician',
    about: 'Specialist in short-circuit detection, appliance installation, MCB trip troubleshooting, and modern home automation switches.',
    match: (s) => {
      const text = `${s?.categoryName || ''} ${s?.title || ''} ${s?.categoryId || ''}`.toLowerCase();
      return text.includes('elect');
    }
  },
  {
    id: 'serv_driver',
    title: 'Driver',
    imageUrl: 'https://kommodo.ai/i/uC1hWGiPT0QP7yVLWILJ',
    image: 'https://kommodo.ai/i/uC1hWGiPT0QP7yVLWILJ',
    directImageUrl: 'https://plain-apac-prod-public.komododecks.com/202610/13/uC1hWGiPT0QP7yVLWILJ/image.png',
    fallbackUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Driver',
    categoryId: 'cat_car',
    price: 399,
    rating: 4.9,
    reviewCount: 310,
    ordersCompleted: 820,
    badge: 'Verified Chauffeur',
    about: 'Experienced on-demand personal driver for city trips, airport drops, and outstation travels with valid commercial license.',
    match: (s) => {
      const text = `${s?.categoryName || ''} ${s?.title || ''} ${s?.categoryId || ''}`.toLowerCase();
      return text.includes('driver') || text.includes('chauffeur');
    }
  }
];

/**
 * Resilient Image Component with Cache Mitigation & Multi-tier Fallback
 * Directly uses remote image URLs without any local asset imports.
 */
function ServiceCardImage({ service, alt }) {
  const [imgSrc, setImgSrc] = useState(service.imageUrl || service.image);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleError = () => {
    if (failedAttempts === 0 && service.directImageUrl && imgSrc !== service.directImageUrl) {
      setFailedAttempts(1);
      setImgSrc(service.directImageUrl);
    } else if (failedAttempts <= 1 && service.fallbackUrl && imgSrc !== service.fallbackUrl) {
      setFailedAttempts(2);
      setImgSrc(service.fallbackUrl);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      data-image-url={service.imageUrl}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className="w-full h-full object-cover block transform group-hover:scale-108 transition-transform duration-500 ease-out will-change-transform"
    />
  );
}

/**
 * PopularServiceSection Component
 * 
 * Features:
 * - Responsive Grid: 2 columns on mobile, 4 columns on desktop (grid-cols-2 md:grid-cols-4)
 * - Strict Data Alignment: Exactly the 4 specified titles and image URLs
 * - Cache Mitigation: Proper src resolution, asynchronous decoding, and lazy loading
 * - Clean UI Layout: High-contrast typography, interactive hover lift, card shadows
 * - Zero Local Asset Imports: Directly utilizes remote image URLs for 100% Vercel & Vite portability
 */
export function PopularServiceSection({
  services = [],
  onSelectService,
  onBookService,
  onOpenAll,
  title = "Popular Services"
}) {
  // Merge static dataset with any dynamic overrides or existing backend records
  const items = POPULAR_SERVICES_DATA.map((item) => {
    const existing = (services || []).find(item.match);
    const activePrice = existing?.price !== undefined && existing?.price !== null ? existing.price : item.price;

    return {
      id: existing?.id || item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      image: item.imageUrl,
      heroImage: item.imageUrl,
      categoryName: existing?.categoryName || item.categoryName,
      categoryId: existing?.categoryId || item.categoryId,
      price: activePrice,
      rating: existing?.rating || item.rating,
      reviewCount: existing?.reviewCount || item.reviewCount,
      ordersCompleted: existing?.ordersCompleted || item.ordersCompleted,
      badge: existing?.badge || item.badge,
      about: existing?.about || item.about,
      directImageUrl: item.directImageUrl,
      fallbackUrl: item.fallbackUrl,
      available: true,
      approved: true,
      workerId: existing?.workerId || 'worker_verified_pro',
      workerName: existing?.workerName || 'JOBit Certified Pro',
      workerPhone: existing?.workerPhone || '8289968045',
      city: existing?.city || 'Melattur, Kerala',
      subCategories: existing?.subCategories || [
        `${item.title} Inspection & Diagnostics`,
        `${item.title} Standard Service & Maintenance`
      ],
      details: existing?.details || [
        `Complete ${item.title} diagnosis and service`,
        `Fixed upfront pricing without hidden charges`,
        `Safety-verified technician equipped with authentic tools`
      ],
      faqs: existing?.faqs || [
        { q: `What is included in ${item.title}?`, a: `Complete doorstep service with inspection and labor included.` },
        { q: `Are replacement materials covered?`, a: `Labor and diagnosis are covered; extra parts are billed at actual cost.` }
      ]
    };
  });

  const handleCardClick = (service) => {
    if (onBookService) {
      onBookService(service);
    } else {
      onSelectService?.(service);
    }
  };

  return (
    <section aria-label={title} className="w-full max-w-full px-4 sm:px-5 pt-3 pb-8 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-extrabold text-[#111827] tracking-tight flex items-center gap-1.5">
          <span>{title}</span>
        </h2>
        {onOpenAll && (
          <button
            type="button"
            onClick={onOpenAll}
            className="text-xs font-semibold text-[#9CA3AF] hover:text-[#0EA5E0] transition-colors cursor-pointer"
            aria-label="View all popular services"
          >
            See all
          </button>
        )}
      </div>

      {/* Responsive Grid: 2 columns on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 w-full">
        {items.map((service) => (
          <article
            key={service.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(service)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(service);
              }
            }}
            data-image-url={service.imageUrl}
            aria-label={`${service.title} • Flat ₹99 Inspection & Service Booking`}
            className="group relative w-full min-w-0 aspect-[4/5] rounded-[16px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(14,165,224,0.18)] cursor-pointer transform hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 border border-slate-100 hover:border-[#0EA5E0]/40 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] focus:ring-offset-2"
            style={{
              borderRadius: '16px',
              isolation: 'isolate',
              WebkitMaskImage: '-webkit-radial-gradient(white, black)'
            }}
          >
            {/* Visual Media Container with Contrast Overlay */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-[16px]"
              style={{ borderRadius: '16px' }}
            >
              <ServiceCardImage service={service} alt={service.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/70" />
            </div>

            {/* Top Promotional Price Badge */}
            <div className="absolute top-2 left-2 z-10 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Zap className="w-3 h-3 fill-slate-950 text-slate-950" />
              <span>Flat ₹99</span>
            </div>

            {/* Bottom Info Bar: Service Name, Starting Price & Action Button */}
            <div 
              className="absolute inset-x-2 bottom-2 z-10 bg-white/95 backdrop-blur-md p-2.5 shadow-sm border border-white/90 flex items-center justify-between gap-1.5 transition-all duration-200 group-hover:bg-white"
              style={{ borderRadius: '12px' }}
            >
              {/* Price & Service Name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-black text-[#0EA5E0] leading-none">
                  <span className="truncate tracking-tight">Flat ₹99</span>
                </div>
                <p className="text-[9px] font-bold text-slate-500 truncate leading-tight mt-0.5">
                  Inspection & Service Booking
                </p>
                <h3 className="text-xs font-black text-[#111827] truncate mt-1 leading-tight group-hover:text-[#0EA5E0] transition-colors" title={service.title}>
                  {service.title}
                </h3>
              </div>

              {/* Action Button: Opens Details/Booking */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(service);
                }}
                className="w-8 h-8 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90 group-hover:rotate-45 transition-all duration-200 cursor-pointer"
                title={`Book ${service.title} at Flat ₹99`}
                aria-label={`Book ${service.title} at Flat ₹99`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PopularServiceSection;
