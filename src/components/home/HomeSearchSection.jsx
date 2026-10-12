import React, { useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Star, Eye, Calendar } from 'lucide-react';

export function HomeSearchSection({
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  onOpenSearch,
  onOpenFilter,
  activeCategoryFilter = 'All',
  onClearFilter,
  searchResults = [],
  onSelectService,
  onBookService
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsSearchFocused]);

  const hasFilter = activeCategoryFilter && activeCategoryFilter !== 'All';

  const getCategoryBadgeInfo = (service) => {
    const cat = service.categoryName || '';
    const title = service.title || '';
    const combined = (cat + ' ' + title).toLowerCase();

    if (combined.includes('plumb')) {
      return { tag: 'Plumber', className: 'bg-[#E0F7FA] text-[#00A3E0]' };
    }
    if (combined.includes('repair') || combined.includes('ac')) {
      return { tag: 'Repairing', className: 'bg-[#FEF3C7] text-[#D97706]' };
    }
    if (combined.includes('clean')) {
      return { tag: 'Cleaning', className: 'bg-[#D1FAE5] text-[#059669]' };
    }
    if (combined.includes('elect')) {
      return { tag: 'Electrician', className: 'bg-[#DBEAFE] text-[#2563EB]' };
    }
    if (combined.includes('paint')) {
      return { tag: 'Painting', className: 'bg-[#F3E8FF] text-[#9333EA]' };
    }
    if (combined.includes('carp')) {
      return { tag: 'Carpenter', className: 'bg-[#FEE2E2] text-[#DC2626]' };
    }
    return { tag: cat || 'Service', className: 'bg-slate-100 text-slate-700' };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsSearchFocused(false);
      onOpenSearch?.(searchQuery);
    }
  };

  return (
    <div className="px-5 pt-3 pb-2" ref={containerRef}>
      {/* 2-Line Bold Heading */}
      <h1 className="text-2xl sm:text-[26px] font-black text-[#111827] leading-[1.2] tracking-tight">
        Which services<br />
        would you like to use
      </h1>

      {/* Search Input Bar + Filter Button */}
      <div className="flex items-center gap-2.5 mt-3.5 relative">
        {/* Search Bar */}
        <div 
          onClick={() => {
            if (!isSearchFocused && !searchQuery) {
              onOpenSearch?.(searchQuery);
            }
          }}
          className="relative flex-1 bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.04)] px-3.5 py-3 flex items-center gap-2.5 border border-white focus-within:ring-2 focus-within:ring-[#4B6EF5]/20 transition cursor-text"
        >
          <Search className="w-4 h-4 text-[#9CA3AF] shrink-0 stroke-[2.2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search Service…"
            className="w-full bg-transparent text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] outline-none"
          />
          {searchQuery && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition shrink-0"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Button (Opens Search & Filter service cards view) */}
        <button
          onClick={() => (onOpenFilter ? onOpenFilter() : onOpenSearch?.())}
          className={`w-12 h-12 rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-95 transition cursor-pointer border shrink-0 relative ${
            hasFilter
              ? 'bg-[#00A3E0] text-white border-[#00A3E0]'
              : 'bg-white text-[#111827] hover:text-[#00A3E0] border-white'
          }`}
          title="Filter services"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
          {hasFilter && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute top-2 right-2 ring-2 ring-white" />
          )}
        </button>
      </div>

      {/* Active Category Filter Tag Header if active */}
      {hasFilter && (
        <div className="flex items-center justify-between px-1 mt-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              Filtered by:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-[#00A3E0] text-xs font-bold border border-sky-100 shadow-2xs">
              <span>{activeCategoryFilter}</span>
              <button
                onClick={onClearFilter}
                className="hover:text-red-500 cursor-pointer text-xs leading-none"
                title="Clear filter"
              >
                ✕
              </button>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {searchResults.length} available
          </span>
        </div>
      )}

      {/* Service Cards Layout when searched or filtered (Matches image_6.png layout strictly) */}
      {((searchQuery.trim().length > 0 && isSearchFocused) || hasFilter) && (
        <div className="mt-3 space-y-3">
          {searchResults.length > 0 ? (
            searchResults.map((service) => {
              const badgeInfo = getCategoryBadgeInfo(service);
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200"
                >
                  {/* Card Top Row: Left Thumbnail, Middle Content, Top Right Tag */}
                  <div className="flex items-start gap-3">
                    {/* Thumbnail image on the left strictly constrained */}
                    <div 
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200/60 shadow-2xs relative"
                      style={{ width: '4.75rem', height: '4.75rem', minWidth: '4.75rem', minHeight: '4.75rem' }}
                    >
                      <img
                        src={service.heroImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80"}
                        alt={service.title}
                        className="w-full h-full object-cover block"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>

                    {/* Middle: Service Title, Star rating, Hourly Pricing */}
                    <div className="flex-1 min-w-0 pr-1">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#111827] leading-snug truncate">
                        {service.title}
                      </h3>

                      {/* Star rating with review count: e.g. ★ 4.8 (180 reviews) */}
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-[#111827]">
                          {service.rating || '4.8'}
                        </span>
                        <span className="text-slate-400 font-medium text-[11px]">
                          ({service.reviewCount || 180} reviews)
                        </span>
                      </div>

                      {/* Hourly pricing: e.g. ₹300/hour */}
                      <div className="mt-1">
                        <span className="text-xs sm:text-sm font-extrabold text-[#111827]">
                          ₹{service.price || 300}/hour
                        </span>
                      </div>
                    </div>

                    {/* Top Right: Category tag pill */}
                    <div className="shrink-0">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight ${badgeInfo.className}`}>
                        {badgeInfo.tag}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Buttons: Two distinct buttons */}
                  <div className="grid grid-cols-2 gap-2.5 mt-3.5 pt-3 border-t border-slate-100/90">
                    {/* Outlined button for 'View Details' (with eye icon) */}
                    <button
                      onClick={() => onSelectService?.(service)}
                      className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 text-[#111827] text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-700 stroke-[2.2]" />
                      <span>View Details</span>
                    </button>

                    {/* Solid blue style button for 'Book Now' (with calendar icon) */}
                    <button
                      onClick={() => onBookService?.(service)}
                      className="w-full py-2.5 px-3 rounded-2xl bg-[#00A3E0] hover:bg-[#0284C7] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-sm shadow-sky-400/25"
                    >
                      <Calendar className="w-3.5 h-3.5 text-white stroke-[2.4]" />
                      <span>Book Now</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center bg-white rounded-3xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-[#111827]">No services found for "{searchQuery}"</p>
              <button
                onClick={() => onOpenSearch?.()}
                className="mt-2 text-xs font-bold text-[#00A3E0] hover:underline cursor-pointer"
              >
                Browse all available services
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
