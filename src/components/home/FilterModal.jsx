import React, { useState, useEffect } from 'react';
import { X, Check, SlidersHorizontal, Star, IndianRupee, RotateCcw } from 'lucide-react';
import { ALL_MAIN_CATEGORIES } from '../../data/categoriesData';
import { CategoryBadgeIcon } from './CategoryBadgeIcon';

export function FilterModal({
  isOpen,
  onClose,
  selectedCategory = 'All',
  onSelectCategory,
  minRating = 0,
  onSelectMinRating,
  maxPrice = 2000,
  onSelectMaxPrice,
  onReset
}) {
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localRating, setLocalRating] = useState(minRating);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  useEffect(() => {
    if (isOpen) {
      setLocalCategory(selectedCategory);
      setLocalRating(minRating);
      setLocalMaxPrice(maxPrice);
    }
  }, [isOpen, selectedCategory, minRating, maxPrice]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectCategory?.(localCategory);
    onSelectMinRating?.(localRating);
    onSelectMaxPrice?.(localMaxPrice);
    onClose?.();
  };

  const handleReset = () => {
    setLocalCategory('All');
    setLocalRating(0);
    setLocalMaxPrice(2000);
    onReset?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose} 
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4B6EF5] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Filter Services</h2>
              <p className="text-xs text-slate-500 font-medium">Select category, ratings, and price budget</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Categories Section - All 20 Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Service Categories ({ALL_MAIN_CATEGORIES.length})
              </h3>
              {localCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setLocalCategory('All')}
                  className="text-xs font-bold text-[#4B6EF5] hover:underline"
                >
                  Show All
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* "All" button */}
              <button
                type="button"
                onClick={() => setLocalCategory('All')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  localCategory === 'All'
                    ? 'bg-[#4B6EF5] text-white border-[#4B6EF5] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {localCategory === 'All' && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                <span>All Categories</span>
              </button>

              {/* All 20 categories with clean CategoryBadgeIcon */}
              {ALL_MAIN_CATEGORIES.map((cat) => {
                const isSelected = localCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setLocalCategory(cat.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#4B6EF5] text-white border-[#4B6EF5] shadow-xs ring-2 ring-[#4B6EF5]/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                    )}
                    <CategoryBadgeIcon 
                      category={cat} 
                      size="sm" 
                      className="w-5 h-5 rounded-md text-xs shrink-0" 
                    />
                    <span className="truncate max-w-[170px]">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating Filter Section */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Minimum Rating
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Any', value: 0 },
                { label: '3.5+ ★', value: 3.5 },
                { label: '4.0+ ★', value: 4.0 },
                { label: '4.5+ ★', value: 4.5 }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setLocalRating(item.value)}
                  className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    localRating === item.value
                      ? 'bg-[#4B6EF5] text-white border-[#4B6EF5] shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-slate-600" />
                Max Price Budget
              </h3>
              <span className="text-xs font-black text-[#4B6EF5]">
                {localMaxPrice >= 2000 ? 'Any Budget' : `Under ₹${localMaxPrice}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { label: '₹400', val: 400 },
                { label: '₹600', val: 600 },
                { label: '₹1000', val: 1000 },
                { label: 'Any', val: 2000 }
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setLocalMaxPrice(p.val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    localMaxPrice === p.val
                      ? 'bg-[#4B6EF5] text-white border-[#4B6EF5]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer border border-slate-200 bg-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#4B6EF5] hover:bg-[#3B5BDB] active:scale-98 text-white font-bold text-sm shadow-md shadow-[#4B6EF5]/25 transition cursor-pointer text-center"
          >
            Apply Filters {localCategory !== 'All' ? `(${localCategory})` : ''}
          </button>
        </div>

      </div>
    </div>
  );
}
export default FilterModal;
