import React from 'react';
import { LayoutGrid } from 'lucide-react';

// Dedicated colorful, high-fidelity vector icons for categories matching the reference
function CategoryIcon({ categoryName = '' }) {
  const name = categoryName.toLowerCase();

  if (name.includes('cook') || name.includes('chef') || name.includes('food')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#FFF1E8] flex items-center justify-center text-xl">
        🍳
      </div>
    );
  }

  if (name.includes('clean') || name.includes('wash') || name.includes('sanit')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#E0F8F3] flex items-center justify-center text-xl">
        🧹
      </div>
    );
  }

  if (name.includes('ship') || name.includes('mov') || name.includes('deliver')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#EDE7F6] flex items-center justify-center text-xl">
        🚚
      </div>
    );
  }

  if (name.includes('plumb') || name.includes('pipe') || name.includes('leak') || name.includes('tap')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-xl">
        🔧
      </div>
    );
  }

  if (name.includes('ac') || name.includes('air') || name.includes('cool')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#E0F7FA] flex items-center justify-center text-xl">
        ❄️
      </div>
    );
  }

  if (name.includes('elect') || name.includes('power') || name.includes('wire')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-xl">
        ⚡
      </div>
    );
  }

  if (name.includes('paint') || name.includes('brush') || name.includes('color')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] flex items-center justify-center text-xl">
        🎨
      </div>
    );
  }

  if (name.includes('carp') || name.includes('wood') || name.includes('furniture')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center text-xl">
        🪚
      </div>
    );
  }

  // Default clean fallback
  return (
    <div className="w-10 h-10 rounded-xl bg-[#EAF0FF] flex items-center justify-center text-xl">
      ✨
    </div>
  );
}

export function CategoryRow({
  categories = [],
  onSelectCategory,
  onOpenAll
}) {
  return (
    <div className="px-5 pt-3 pb-2">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-base font-extrabold text-[#111827] tracking-tight">
          Service Category
        </h2>
        <button
          onClick={onOpenAll}
          className="text-xs font-semibold text-[#9CA3AF] hover:text-[#4B6EF5] transition-colors cursor-pointer"
        >
          See all
        </button>
      </div>

      {/* Horizontally Scrollable Row */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 py-1">
        {categories.map((cat) => (
          <button
            key={cat.id || cat.name}
            onClick={() => onSelectCategory?.(cat)}
            className="w-[74px] h-[82px] sm:w-[78px] sm:h-[86px] rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white hover:border-[#4B6EF5]/30 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center p-2 shrink-0 cursor-pointer group"
          >
            {/* Category Icon / Image */}
            <div className="transition-transform group-hover:scale-105">
              <CategoryIcon categoryName={cat.name} />
            </div>

            {/* Category Name */}
            <span className="text-[11px] font-semibold text-slate-800 mt-1.5 text-center truncate w-full group-hover:text-[#4B6EF5] transition-colors">
              {cat.name}
            </span>
          </button>
        ))}

        {/* Last item: "+" / grid icon card for "See all" */}
        <button
          onClick={onOpenAll}
          className="w-[74px] h-[82px] sm:w-[78px] sm:h-[86px] rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white hover:border-[#4B6EF5]/30 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center p-2 shrink-0 cursor-pointer group"
          title="See all categories"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EAF0FF] flex items-center justify-center text-[#4B6EF5] transition-transform group-hover:scale-105">
            <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-semibold text-[#4B6EF5] mt-1.5 text-center truncate w-full">
            See all
          </span>
        </button>
      </div>
    </div>
  );
}
