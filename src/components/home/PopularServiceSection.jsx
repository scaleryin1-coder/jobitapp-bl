import React from 'react';
import { Zap, ArrowUpRight } from 'lucide-react';
import lawnGardenImg from '../../assets/images/lawn_and_garden.jpg';
import electricalDiagImg from '../../assets/images/electrical_diagnosis.jpg';
import acRepairImg from '../../assets/images/ac_repair.jpg';
import driverImg from '../../assets/images/driver_service.jpg';

// Exact 4 Popular Services in specified order with local high-resolution assets & remote fallbacks
const POPULAR_SERVICES_CONFIG = [
  {
    key: 'lawn_and_garden',
    title: 'Lawn & Garden',
    categoryName: 'Garden & Outdoor Work',
    categoryId: 'cat_garden',
    defaultPrice: 399,
    image: lawnGardenImg,
    staticPath: '/assets/images/lawn_and_garden.jpg',
    remoteFallback: 'https://previews.jumpshare.com/thumb/4ea2c443a4623ad282087187a00fc4265c383b5dec85a7eaf398e1f6df37600956b79715cb707dd58c6733804f818fec0f822811500eb6cf8e79207c582ff40dc4eb4403886d623016f5d2eeab31c5b4',
    match: (s) => {
      const text = `${s.categoryName || ''} ${s.title || ''} ${s.categoryId || ''}`.toLowerCase();
      return text.includes('garden') || text.includes('lawn');
    }
  },
  {
    key: 'electrical_diagnosis',
    title: 'Electrical Diagnosis',
    categoryName: 'Electrician',
    categoryId: 'cat_electrician',
    defaultPrice: 320,
    image: electricalDiagImg,
    staticPath: '/assets/images/electrical_diagnosis.jpg',
    remoteFallback: 'https://previews.jumpshare.com/thumb/4ea2c443a4623ad282087187a00fc42690f52c1ea4c3d04f3bbe97ac43e058b632b0cc9f3179dccace61d16c4ca285c7a5ab87742274805a78c60493e6643c1ab8784ae51b4ebb17ce28db80bb226210',
    match: (s) => {
      const text = `${s.categoryName || ''} ${s.title || ''} ${s.categoryId || ''}`.toLowerCase();
      return text.includes('elect') || text.includes('diagnos');
    }
  },
  {
    key: 'ac_repair',
    title: 'AC Repair',
    categoryName: 'AC Service',
    categoryId: 'cat_ac',
    defaultPrice: 450,
    image: acRepairImg,
    staticPath: '/assets/images/ac_repair.jpg',
    remoteFallback: 'https://plain-apac-prod-public.komododecks.com/202610/13/aHoRsSc2PvL7oqXS751j/image.jpg',
    match: (s) => {
      const text = `${s.categoryName || ''} ${s.title || ''} ${s.categoryId || ''}`.toLowerCase();
      return text.includes('ac') || text.includes('air condition');
    }
  },
  {
    key: 'driver',
    title: 'Driver',
    categoryName: 'Driver',
    categoryId: 'cat_car',
    defaultPrice: 399,
    image: driverImg,
    staticPath: '/assets/images/driver_service.jpg',
    remoteFallback: 'https://plain-apac-prod-public.komododecks.com/202610/13/A5bkDbHqJW9Z2zvX6HjN/image.jpg',
    match: (s) => {
      const text = `${s.categoryName || ''} ${s.title || ''} ${s.categoryId || ''}`.toLowerCase();
      return text.includes('driver') || text.includes('chauffeur');
    }
  }
];

export function PopularServiceSection({
  services = [],
  onSelectService,
  onOpenAll
}) {
  // Construct the exact 4 popular services matching with dynamic data or fallbacks
  const popularList = POPULAR_SERVICES_CONFIG.map((cfg) => {
    const existing = (services || []).find(cfg.match);

    const activeImage = cfg.image || cfg.staticPath;
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
      fallbackRemote: cfg.remoteFallback,
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
    <div className="w-full max-w-full px-5 pt-3 pb-8 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-[#111827] tracking-tight">
          Popular Services
        </h2>
        <button
          onClick={onOpenAll}
          className="text-xs font-semibold text-[#9CA3AF] hover:text-[#0EA5E0] transition-colors cursor-pointer"
        >
          See all
        </button>
      </div>

      {/* 2-Column Grid of exactly 4 Cards with consistent aspect ratio & 16px border-radius */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 w-full">
        {popularList.map((service) => (
          <div
            key={service.id}
            onClick={() => onSelectService?.(service)}
            className="group relative w-full min-w-0 aspect-[4/5] rounded-[16px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] cursor-pointer active:scale-[0.98] transition-all duration-200 border border-slate-100 bg-slate-100"
            style={{
              borderRadius: '16px',
              isolation: 'isolate',
              WebkitMaskImage: '-webkit-radial-gradient(white, black)' // Fixes WebKit border-radius clipping bug
            }}
          >
            {/* Dedicated Fully-Constrained Responsive Image Container */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-[16px]"
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '16px',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            >
              <img
                src={service.heroImage}
                alt={service.title}
                className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500 rounded-[16px]"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  display: 'block'
                }}
                loading="lazy"
                onError={(e) => {
                  if (service.fallbackRemote && e.currentTarget.src !== service.fallbackRemote) {
                    e.currentTarget.src = service.fallbackRemote;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom Frosted-Glass Strip */}
            <div 
              className="absolute inset-x-2 bottom-2 z-10 bg-white/90 backdrop-blur-md p-2.5 shadow-sm border border-white/90 flex items-center justify-between gap-1.5 transition-all"
              style={{ borderRadius: '12px' }}
            >
              {/* Price & Service Name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 leading-none">
                  <Zap className="w-3 h-3 text-[#0EA5E0] fill-[#0EA5E0] shrink-0" />
                  <span className="truncate">From ₹{service.price}</span>
                </div>
                <p className="text-xs font-black text-[#111827] truncate mt-1 leading-tight" title={service.title}>
                  {service.title}
                </p>
              </div>

              {/* Round Blue Button with Arrow Up Right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectService?.(service);
                }}
                className="w-8 h-8 rounded-full bg-[#0EA5E0] hover:bg-[#0284C7] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition cursor-pointer"
                title={`Book ${service.title}`}
                aria-label={`View details for ${service.title}`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
