import React, { useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, X, ArrowRight, Zap } from 'lucide-react';

export function HomeSearchSection({
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  onOpenSearch,
  searchResults = [],
  categories = [],
  onSelectCategory,
  onSelectService
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

  const matchingCategories = searchQuery.trim()
    ? categories.filter(c => c?.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : [];

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
        <div className="relative flex-1 bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.04)] px-3.5 py-3 flex items-center gap-2.5 border border-white focus-within:ring-2 focus-within:ring-[#4B6EF5]/20 transition">
          <Search className="w-4 h-4 text-[#9CA3AF] shrink-0 stroke-[2.2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search Service…"
            className="w-full bg-transparent text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition shrink-0"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={onOpenSearch}
          className="w-12 h-12 rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#111827] hover:text-[#4B6EF5] active:scale-95 transition cursor-pointer border border-white shrink-0"
          title="Filter and browse all services"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Autocomplete Dropdown Search Results */}
      {searchQuery.trim().length > 0 && isSearchFocused && (
        <div className="mt-2.5 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100/90 overflow-hidden z-30 relative divide-y divide-slate-100 animate-fadeIn">
          
          {/* Matching Categories */}
          {matchingCategories.length > 0 && (
            <div className="p-3 bg-slate-50/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9CA3AF] block mb-2 px-1">
                Categories
              </span>
              <div className="flex flex-wrap gap-2">
                {matchingCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelectCategory?.(cat);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-[#4B6EF5] text-xs font-bold text-[#111827] cursor-pointer transition"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-[#4B6EF5] font-extrabold">Filter</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Service Search Results */}
          {searchResults.length > 0 ? (
            <div className="max-h-60 overflow-y-auto no-scrollbar divide-y divide-slate-100">
              {searchResults.map((service) => (
                <div
                  key={service.id}
                  onClick={() => {
                    onSelectService?.(service);
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="p-3 hover:bg-[#F5FBFF] transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={service.heroImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80'}
                      alt={service.title}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-100"
                    />
                    <div>
                      <p className="text-xs font-black text-[#111827] group-hover:text-[#4B6EF5] transition leading-tight">
                        {service.title}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                        {service.categoryName} • ★ {service.rating || '4.9'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-xs font-black text-[#111827]">₹{service.price}</span>
                    <div className="text-[10px] font-bold text-[#4B6EF5] flex items-center justify-end gap-0.5 mt-0.5">
                      <span>Book</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400 text-xs">
              <p className="font-bold text-[#111827]">No service found for "{searchQuery}"</p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Try searching Plumbing, Cleaning, or AC</p>
            </div>
          )}

          {/* Quick link to full Search Service screen */}
          <button
            onClick={() => {
              setIsSearchFocused(false);
              onOpenSearch?.();
            }}
            className="w-full p-2.5 bg-slate-50 hover:bg-[#F5FBFF] text-center text-xs font-bold text-[#4B6EF5] cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <span>Browse All Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
