import React, { useState } from 'react';
import { X, Search, ChevronRight, Sparkles } from 'lucide-react';
import { ALL_MAIN_CATEGORIES } from '../../data/categoriesData';

export function AllCategoriesModal({
  isOpen,
  onClose,
  onSelectCategory
}) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCategories = ALL_MAIN_CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    cat.subCategories.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl relative border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h3 className="text-lg font-black text-[#111827] tracking-tight">
              All Service Categories
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Choose from 20 certified home services
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F1F3F5] text-slate-600 flex items-center justify-center hover:bg-slate-200 transition active:scale-95 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Search Bar in Modal */}
        <div className="px-5 pt-3 pb-2 shrink-0 bg-white">
          <div className="relative bg-[#F8FAFC] border border-slate-200/90 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category or issue..."
              className="w-full bg-transparent text-xs font-semibold text-[#111827] placeholder:text-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 20 Categories Grid List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 pt-2 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat);
                  onClose();
                }}
                className="bg-[#F8FAFC] hover:bg-[#EAF0FF] border border-slate-200/70 hover:border-[#4B6EF5] rounded-2xl p-3 cursor-pointer transition active:scale-98 group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4B6EF5] group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="mt-2.5">
                  <h4 className="text-xs font-black text-[#111827] group-hover:text-[#4B6EF5] transition-colors leading-snug">
                    {cat.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Starts ₹{cat.basePrice}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p className="font-bold text-slate-600">No categories matching "{searchQuery}"</p>
              <p className="mt-1">Try searching Electrician, Plumber, or AC</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
