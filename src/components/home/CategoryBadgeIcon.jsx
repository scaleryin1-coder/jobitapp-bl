import React, { useState, useEffect } from 'react';
import { ALL_MAIN_CATEGORIES } from '../../data/categoriesData';

/**
 * CategoryBadgeIcon:
 * Renders vibrant custom category images (when set via Admin panel),
 * 3D emoji, or colorful vector icons inside rounded soft-background
 * badge containers matching the design for all categories:
 *
 * 1. Electrician: ⚡ Lightning Bolt
 * 2. AC Service: ❄️ Snowflake / AC icon
 * 3. Plumber: 🔧 Wrench / Spanner
 * 4. Carpenter: 🪚 Hand Saw
 * 5. Painting & Wall Work: 🎨 Artist Palette
 * 6. Construction: 🏗️ Tower Crane
 * 7. Welding: 🔥 Flame / Fire
 * 8. Aluminium Fabrication: 🪟 Window frame
 * 9. Garden & Outdoor Work: 🍃 Green Leaves / Plant
 * 10. Pest Control: 🐜 Ant / Bug
 * 11. Bike Service: 🏍️ Motorcycle
 * 12. Car Mechanic: 🚗 Red Car
 * 13. Moving & Labour Service: 📦 Moving Box / Truck
 * 14. Security & Smart Home: 🔒 Smart Lock / CCTV
 * 15. Electronics Service: washing machine / appliance (clean 3D vector or emoji)
 * 16. Laundry Service: 🧺 Laundry Basket / Washing Machine
 * 17. Home Support Service: 🧹 Broom / Housekeeper
 * 18. Beauty & Personal Care: 💄 Lipstick / Scissors
 * 19. Mehndi Artist: 🖐️ Decorated Henna Hand / Cone
 * 20. Water Tank & Waste Service: 🛢️ Water Tank / Recycling Bin
 */

// Normalized category mapping table to ensure exact prompt matching
const CATEGORY_MAP = {
  electrician: {
    emoji: '⚡',
    color: '#FEF3C7', // soft pastel yellow/amber
    label: 'Electrician'
  },
  ac: {
    emoji: '❄️',
    color: '#E0F2FE', // soft pastel sky cyan
    label: 'AC Service'
  },
  coconut: {
    emoji: '🌴',
    color: '#DCFCE7', // soft pastel natural green
    label: 'Coconut Tree Climbing'
  },
  'തെങ്ങ്': {
    emoji: '🌴',
    color: '#DCFCE7',
    label: 'Coconut Tree Climbing'
  },
  plumber: {
    emoji: '🔧',
    color: '#E0F2FE', // soft pastel sky blue
    label: 'Plumber'
  },
  carpenter: {
    emoji: '🪚',
    color: '#FEE2E2', // soft pastel warm red/pink
    label: 'Carpenter'
  },
  painting: {
    emoji: '🎨',
    color: '#F3E8FF', // soft pastel lavender/purple
    label: 'Painting & Wall Work'
  },
  construction: {
    emoji: '🏗️',
    color: '#FFEDD5', // soft pastel orange
    label: 'Construction'
  },
  welding: {
    emoji: '🔥',
    color: '#FEE2E2', // soft pastel warm peach/flame
    label: 'Welding'
  },
  aluminium: {
    emoji: '🪟',
    color: '#F1F5F9', // soft pastel slate blue/glass
    label: 'Aluminium Fabrication'
  },
  fabrication: {
    emoji: '🪟',
    color: '#F1F5F9',
    label: 'Aluminium Fabrication'
  },
  garden: {
    emoji: '🍃',
    color: '#DCFCE7', // soft pastel mint green
    label: 'Garden & Outdoor Work'
  },
  pest: {
    emoji: '🐜',
    color: '#FEF9C3', // soft pastel light lime
    label: 'Pest Control'
  },
  bike: {
    emoji: '🏍️',
    color: '#E0E7FF', // soft pastel indigo
    label: 'Bike Service'
  },
  car: {
    emoji: '🚗',
    color: '#FEE2E2', // soft pastel warm red
    label: 'Car Mechanic'
  },
  moving: {
    emoji: '📦',
    color: '#FEF3C7', // soft pastel warm amber
    label: 'Moving & Labour Service'
  },
  labour: {
    emoji: '📦',
    color: '#FEF3C7',
    label: 'Moving & Labour Service'
  },
  security: {
    emoji: '🔒',
    color: '#EDE9FE', // soft pastel purple/lavender
    label: 'Security & Smart Home'
  },
  smart: {
    emoji: '🔒',
    color: '#EDE9FE',
    label: 'Security & Smart Home'
  },
  electronics: {
    // Electronics service: washing machine as specifically requested
    isWashingMachineSvg: true,
    emoji: '🧺',
    color: '#E0F2FE', // soft pastel cyan
    label: 'Electronics Service'
  },
  laundry: {
    emoji: '🧺',
    color: '#E0F8F3', // soft pastel cyan mint
    label: 'Laundry Service'
  },
  'home support': {
    emoji: '🧹',
    color: '#F1F5F9', // soft pastel pearl slate
    label: 'Home Support Service'
  },
  cleaning: {
    emoji: '🧹',
    color: '#F1F5F9',
    label: 'Home Support Service'
  },
  beauty: {
    emoji: '💄',
    color: '#FDF2F8', // soft pastel rose/pink
    label: 'Beauty & Personal Care'
  },
  mehndi: {
    emoji: '🖐️',
    color: '#FFF1EE', // soft pastel warm peach/coral
    label: 'Mehndi Artist'
  },
  henna: {
    emoji: '🖐️',
    color: '#FFF1EE',
    label: 'Mehndi Artist'
  },
  tank: {
    emoji: '🛢️',
    color: '#CFFAFE', // soft pastel aqua/teal
    label: 'Water Tank & Waste Service'
  },
  waste: {
    emoji: '🛢️',
    color: '#CFFAFE',
    label: 'Water Tank & Waste Service'
  }
};

/**
 * High-definition vibrant 3D-styled Washing Machine icon
 * for the "Electronics Service: washing machine" requirement
 */
function WashingMachineGraphic({ isSm = false }) {
  const iconSize = isSm ? 14 : 22;
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-xs"
    >
      {/* Outer machine body */}
      <rect
        x="3"
        y="2"
        width="18"
        height="20"
        rx="3.5"
        fill="#3B82F6"
      />
      {/* Top dashboard panel */}
      <rect
        x="3"
        y="2"
        width="18"
        height="5"
        rx="2"
        fill="#2563EB"
      />
      {/* Dials / buttons on control panel */}
      <circle cx="6" cy="4.5" r="1" fill="#FEF08A" />
      <circle cx="9" cy="4.5" r="0.8" fill="#FFFFFF" />
      <rect x="14" y="3.8" width="4.5" height="1.4" rx="0.7" fill="#60A5FA" />

      {/* Main glass door outer ring */}
      <circle
        cx="12"
        cy="14"
        r="5.5"
        fill="#1D4ED8"
      />
      {/* Inner drum glass with water shine */}
      <circle
        cx="12"
        cy="14"
        r="4.2"
        fill="#67E8F9"
      />
      {/* Water swirling wave inside drum */}
      <path
        d="M9.5 14.5C10 13.5 11.2 13.5 12 14.5C12.8 15.5 14 15.5 14.5 14.5"
        stroke="#0284C7"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Glass reflection highlight */}
      <path
        d="M10 11.5A3 3 0 0 1 14 11.5"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Door handle latch */}
      <rect x="16.5" y="13.2" width="1" height="1.6" rx="0.5" fill="#FFFFFF" />
    </svg>
  );
}

export function CategoryBadgeIcon({ 
  category, 
  categoryName = '', 
  size = 'md', 
  className = '' 
}) {
  const [imgError, setImgError] = useState(false);
  const rawName = (category?.name || categoryName || '').toLowerCase().trim();

  // Find direct match or keyword match in CATEGORY_MAP
  let config = null;
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (rawName.includes(key)) {
      config = val;
      break;
    }
  }

  // Fallback to ALL_MAIN_CATEGORIES definition or category object
  const matchedFromMain = ALL_MAIN_CATEGORIES.find(c =>
    c.name.toLowerCase() === rawName ||
    rawName.includes(c.name.toLowerCase()) ||
    c.name.toLowerCase().includes(rawName)
  );

  const emoji = category?.icon || config?.emoji || matchedFromMain?.icon || '🛠️';
  const bgColor = category?.color || config?.color || matchedFromMain?.color || '#F1F5F9';
  const isSm = size === 'sm';
  const isWashingMachine = config?.isWashingMachineSvg || rawName.includes('electron');

  // Check for custom image
  const rawImage = category?.image || category?.imageUrl || '';
  const isIconAnImage = typeof category?.icon === 'string' && (category.icon.startsWith('http') || category.icon.startsWith('data:') || category.icon.startsWith('/'));
  const customImgSrc = rawImage || (isIconAnImage ? category.icon : '');
  const hasCustomImage = Boolean(customImgSrc && !imgError);

  useEffect(() => {
    setImgError(false);
  }, [category?.image, category?.imageUrl, category?.icon]);

  return (
    <div
      className={`shrink-0 flex items-center justify-center select-none transition-transform overflow-hidden relative ${
        isSm
          ? 'w-6 h-6 rounded-lg text-xs'
          : 'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
      } ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {hasCustomImage ? (
        <img
          src={customImgSrc}
          alt={category?.name || categoryName || 'Category'}
          className="w-full h-full object-cover rounded-[inherit] block select-none pointer-events-none"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : isWashingMachine ? (
        <WashingMachineGraphic isSm={isSm} />
      ) : (
        <span 
          className="leading-none transform transition-transform group-hover:scale-110 active:scale-95 filter drop-shadow-2xs inline-block"
          role="img"
          aria-label={category?.name || categoryName || 'Category icon'}
        >
          {emoji}
        </span>
      )}
    </div>
  );
}
