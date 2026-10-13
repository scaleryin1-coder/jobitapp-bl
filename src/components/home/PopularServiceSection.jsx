import React from 'react';
import { Zap, ArrowUpRight } from 'lucide-react';
import acTechnicianImg from '../../assets/images/ac_technician_new.png';
import lawnGardenImg from '../../assets/images/lawn_and_garden_new.png';
import electricianImg from '../../assets/images/electrician_new.png';
import driverImg from '../../assets/images/driver_new.png';

/**
 * Popular Services Configuration
 * Strictly preserves the requested image links without modifications:
 * - AC Technician: https://kommodo.ai/i/410CrPRmc9hsuyX0Eb4d
 * - Lawn & Garden: https://kommodo.ai/i/Wh1T3p3vwgl9o8sLMgZE
 * - Electrician: https://kommodo.ai/i/21VGnAa5VQ7rZ5Vr4l5H
 * - Driver: https://kommodo.ai/i/uC1hWGiPT0QP7yVLWILJ
 *
 * Direct image CDN assets and local bundled assets ensure 100% reliable rendering.
 */
export const POPULAR_SERVICES_CONFIG = [
  {
    key: 'ac_technician',
    title: 'AC Technician',
    categoryName: 'AC Service',
    categoryId: 'cat_ac',
    defaultPrice: 450,
    originalImageLink: 'https://kommodo.ai/i/410CrPRmc9hsuyX0Eb4d',
    directImageUrl: 'https://plain-apac-prod-public.komododecks.com/202610/13/410CrPRmc9hsuyX0Eb4d/image.png',
    localAsset: acTechnicianImg,
    staticPath: '/assets/images/ac_technician_new.png',
    match: (s) => {
      const text = `${s.categoryName || ''} ${s.title || ''} ${s.categoryId || ''}`.toLowerCase();
      return text.includes('ac') || text.includes('air condition') || text.includes('technician');
    }
  },
  {
    key: 'lawn_and_garden',
    title: 'Lawn & Garden',
    categoryName: 'Garden & Outdoor Work',
    categoryId: 'cat_garden',
    defaultPrice: 399,
    originalImageLink: 'https://kommodo.ai/i/Wh1T3p3vwgl9o8sLMgZE',
    directImageUrl: 'https://plain-apac-prod-public.komododecks.com/202610/13/Wh1T3p3vwgl9o8sLMgZE/image.png',
    localAsset: lawnGardenImg,
    staticPath: '/assets/images/lawn_and_garden_new.png',
    match: (s) => {
      const text = `${s.categoryName || ''} ${s.title || ''} ${s.categoryId || ''}`.toLowerCase();
      return text.includes('garden') || text.includes('lawn');
    }
  },
  {
    key: 'electrician',
    title: 'Electrician',
    categoryName: 'Electrician',
    categoryId: 'cat_electrician',
    defaultPrice: 320,
    originalImageLink: 'https://kommodo.ai/i/21VGnAa5VQ7rZ5Vr4l5H',
    directImageUrl: 'https://plain-apac-prod-public.komododecks.com/202610/13/21VGnAa5VQ7rZ5Vr4l5H/image.png',
    localAsset: electricianImg,
    staticPath: '/assets/images/electrician_new.png',
    match: (s) => {
      const text = `${s.categoryName || ''} ${s.title || ''} ${s.categoryId || ''}`.toLowerCase();
      return text.includes('elect');
    }
  },
  {
    key: 'driver',
    title: 'Driver',
    categoryName: 'Driver',
    categoryId: 'cat_car',
    defaultPrice: 399,
    originalImageLink: 'https://kommodo.ai/i/uC1hWGiPT0QP7yVLWILJ',
    directImageUrl: 'https://plain-apac-prod-public.komododecks.com/202610/13/uC1hWGiPT0QP7yVLWILJ/image.png',
    localAsset: driverImg,
    staticPath: '/assets/images/driver_new.png',
    match: (s) => {
      const text = `${s.categoryName || ''} ${s.title || ''} ${s.categoryId || ''}`.toLowerCase();
      return text.includes('driver') || text.includes('chauffeur');
    }
  }
];

export function PopularServiceSection({
  services = [],
  onSelectService,
  onOpenAll,
  title = "Popular Services"
}) {
  // Construct the 4 popular services matching with dynamic data or seed records
  const popularList = POPULAR_SERVICES_CONFIG.map((cfg) => {
    const existing = (services || []).find(cfg.match);

    const activeImage = cfg.localAsset || cfg.staticPath || cfg.directImageUrl;
    const activePrice = existing?.price !== undefined && existing?.price !== null ? existing.price : cfg.defaultPrice;

    return {
      id: existing?.id || `serv_popular_${cfg.key}`,
      title: cfg.title,
      categoryName: existing?.categoryName || cfg.categoryName,
      categoryId: existing?.categoryId || cfg.categoryId,
      price: activePrice,
      rating: existing?.rating || 4.9,
      reviewCount: existing?.reviewCount || 230,
      ordersCompleted: existing?.ordersCompleted || 450,
      heroImage: activeImage,
      imageUrl: activeImage,
      image: activeImage,
      // Strictly preserved original image URL from prompt
      originalImageLink: cfg.originalImageLink,
      imageLink: cfg.originalImageLink,
      directImageUrl: cfg.directImageUrl,
      fallbackRemote: cfg.directImageUrl,
      localAsset: cfg.localAsset,
      workerId: existing?.workerId || 'worker_verified_pro',
      workerName: existing?.workerName || 'JOBit Certified Pro',
      workerPhone: existing?.workerPhone || '8289968045',
      badge: existing?.badge || 'Certified & Background Checked',
      city: existing?.city || 'Melattur, Kerala',
      available: true,
      approved: true,
      subCategories: existing?.subCategories || [
        `${cfg.title} Inspection & Diagnostics`,
        `${cfg.title} Standard Service & Maintenance`
      ],
      details: existing?.details || [
        `Complete ${cfg.title} inspection and diagnosis`,
        `Fixed transparent task-based rates`,
        `Safety verified technician equipped with tools`
      ],
      faqs: existing?.faqs || [
        { q: `What is included in ${cfg.title}?`, a: `Complete doorstep service with inspection and labor included.` },
        { q: `Are replacement materials covered?`, a: `Labor and diagnosis are covered; extra parts are billed at actual cost.` }
      ],
      about: existing?.about || `Professional, verified ${cfg.title} delivered by certified JOBit technicians equipped with specialized tools.`
    };
  });

  return (
    <section aria-label={title} className="w-full max-w-full px-5 pt-3 pb-8 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-extrabold text-[#111827] tracking-tight flex items-center gap-1.5">
          <span>{title}</span>
        </h2>
        <button
          type="button"
          onClick={onOpenAll}
          className="text-xs font-semibold text-[#9CA3AF] hover:text-[#0EA5E0] transition-colors cursor-pointer"
          aria-label="View all popular services"
        >
          See all
        </button>
      </div>

      {/* 2-Column Mobile-First Responsive Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        {popularList.map((service) => (
          <article
            key={service.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectService?.(service)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectService?.(service);
              }
            }}
            data-image-link={service.originalImageLink}
            aria-label={`${service.title} starting from ₹${service.price}`}
            className="group relative w-full min-w-0 aspect-[4/5] rounded-[16px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] cursor-pointer active:scale-[0.98] transition-all duration-200 border border-slate-100 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0EA5E0] focus:ring-offset-2"
            style={{
              borderRadius: '16px',
              isolation: 'isolate',
              WebkitMaskImage: '-webkit-radial-gradient(white, black)'
            }}
          >
            {/* Service Image Container */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-[16px]"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '16px'
              }}
            >
              <img
                src={service.heroImage}
                alt={service.title}
                data-original-link={service.originalImageLink}
                className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500 rounded-[16px]"
                loading="lazy"
                onError={(e) => {
                  // Resilient fallback chain
                  if (service.directImageUrl && e.currentTarget.src !== service.directImageUrl) {
                    e.currentTarget.src = service.directImageUrl;
                  } else if (service.localAsset && e.currentTarget.src !== service.localAsset) {
                    e.currentTarget.src = service.localAsset;
                  }
                }}
              />
              {/* Subtle contrast gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />
            </div>

            {/* Bottom Info Bar: Service Name, Starting Price & Action Button */}
            <div 
              className="absolute inset-x-2 bottom-2 z-10 bg-white/95 backdrop-blur-md p-2.5 shadow-sm border border-white/90 flex items-center justify-between gap-1.5 transition-all"
              style={{ borderRadius: '12px' }}
            >
              {/* Price & Service Name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 leading-none">
                  <Zap className="w-3 h-3 text-[#0EA5E0] fill-[#0EA5E0] shrink-0" aria-hidden="true" />
                  <span className="truncate">From ₹{service.price}</span>
                </div>
                <h3 className="text-xs font-black text-[#111827] truncate mt-1 leading-tight" title={service.title}>
                  {service.title}
                </h3>
              </div>

              {/* Action Button: Opens Details/Booking */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectService?.(service);
                }}
                className="w-8 h-8 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition cursor-pointer"
                title={`Book ${service.title}`}
                aria-label={`Book ${service.title}`}
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
