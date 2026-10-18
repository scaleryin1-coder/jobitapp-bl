import React, { useState } from 'react';
import { LayoutGrid, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryBadgeIcon } from './CategoryBadgeIcon';
import { isPortfolioCategory } from '../../data/categoriesData';
import { isCategoryAvailableInLocation } from '../../data/bookingService';

export function CategoryRow({
  categories = [],
  onSelectCategory,
  onOpenAll,
  currentLocation = 'Melattur, Kerala',
  workers = []
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If expanded, show all categories; otherwise show top 7 + 1 'See all' card for a clean 8-card (2x4) grid
  const displayCategories = isExpanded ? categories : categories.slice(0, 7);
  const totalCount = categories.length || 20;

  return (
    <section className="px-5 pt-3 pb-2 w-full">
      {/* Row Header with Category Count and See All */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black text-[#111827] tracking-tight">
            Service Categories
          </h2>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#4B6EF5] border border-blue-100">
            {totalCount} Services
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="text-xs font-bold text-[#4B6EF5] hover:text-[#3D5FE0] transition-colors flex items-center gap-0.5 cursor-pointer"
        >
          <span>See all</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Responsive Grid Layout for Service Category Cards */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3.5">
        {displayCategories.map((cat) => {
          const isPortfolio = isPortfolioCategory(cat);
          const isLive = isCategoryAvailableInLocation(cat, currentLocation, workers);

          return (
            <button
              key={cat.id || cat.name}
              type="button"
              onClick={() => onSelectCategory?.(cat, isLive)}
              className="category-card relative rounded-2xl bg-white shadow-xs hover:shadow-md border border-slate-100 hover:border-[#4B6EF5]/40 active:scale-95 transition-all flex flex-col items-center justify-center p-2 sm:p-2.5 min-h-[92px] sm:min-h-[100px] cursor-pointer group"
            >
              {/* Category Badges */}
              {isPortfolio && (
                <span className="absolute -top-1.5 -right-1 bg-gradient-to-r from-purple-600 to-sky-600 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full shadow-xs leading-none z-10">
                  ALBUM
                </span>
              )}

              {!isLive && !isPortfolio && (
                <span className="absolute -top-1.5 -left-1 bg-amber-500 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full shadow-xs leading-none z-10">
                  SOON
                </span>
              )}

              {isLive && !isPortfolio && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" title="Service Available" />
              )}

              {/* Category Icon / Graphic */}
              <div className="transition-transform group-hover:scale-105 shrink-0">
                <CategoryBadgeIcon category={cat} categoryName={cat.name} />
              </div>

              {/* Category Name */}
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 mt-1.5 text-center line-clamp-2 w-full leading-tight group-hover:text-[#4B6EF5] transition-colors">
                {cat.name}
              </span>
            </button>
          );
        })}

        {/* 8th Card in Collapsed State: "See all" card to complete symmetric 2x4 grid */}
        {!isExpanded && categories.length > 7 && (
          <button
            type="button"
            onClick={onOpenAll}
            className="category-card relative rounded-2xl bg-white shadow-xs hover:shadow-md border border-blue-100 hover:border-[#4B6EF5] active:scale-95 transition-all flex flex-col items-center justify-center p-2 sm:p-2.5 min-h-[92px] sm:min-h-[100px] cursor-pointer group"
            title="View all 20 categories"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#EAF0FF] flex items-center justify-center text-[#4B6EF5] transition-transform group-hover:scale-105">
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[11px] sm:text-xs font-extrabold text-[#4B6EF5] mt-1.5 text-center leading-tight">
              See All ({categories.length})
            </span>
          </button>
        )}
      </div>

      {/* Expand / Collapse In-Page Toggle Button */}
      {categories.length > 8 && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-500 hover:text-[#4B6EF5] transition-colors py-1 px-3 rounded-full hover:bg-white/80 cursor-pointer"
          >
            <span>{isExpanded ? 'Show Less' : `View All ${categories.length} Categories in Grid`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </section>
  );
}

export default CategoryRow;
