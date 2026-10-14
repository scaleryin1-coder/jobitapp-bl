import React from 'react';

/**
 * JOBit Official Brand Logo Component
 * 
 * Implements the brand specifications:
 * - Clean solid white background or transparent vector wrapper
 * - Vibrant Crisp Deep Red Location Pin (#D32F2F) centered directly above
 * - Integrated Deep Navy Blue (#0B172E) squared icon block with uniform white service elements:
 *   - Hand gripping spanner (plumbing/mechanical)
 *   - Simple house silhouette with checkmark (home services)
 *   - Clean lightning bolt with leaves (electrical/ac)
 *   - Water droplet with power symbol (water/utilities)
 *   - Clean vertical ladder silhouette (tree services/climbing)
 * - Modern sans-serif 'JOBit' typography:
 *   - 'JOB' (ALL CAPS, bold) in rich Red (#D32F2F)
 *   - 'it' (bold) in deep Navy Blue (#0B172E)
 * - Tagline: 'Reliable Local Services | Melattur' in deep navy blue
 */
export function JobitLogo({
  variant = 'full', // 'full' | 'compact' | 'horizontal' | 'mark' | 'image'
  size = 'md',      // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  className = '',
  showTagline = true,
  onClick
}) {
  // Dimension presets
  const sizeMap = {
    xs: { width: 32, height: 32, fontSize: 10 },
    sm: { width: 48, height: 48, fontSize: 13 },
    md: { width: 120, height: 120, fontSize: 24 },
    lg: { width: 220, height: 220, fontSize: 36 },
    xl: { width: 320, height: 320, fontSize: 48 }
  };

  // If raster image variant is requested
  if (variant === 'image') {
    const dim = typeof size === 'number' ? size : (sizeMap[size]?.width || 160);
    return (
      <div 
        className={`inline-flex items-center justify-center bg-white rounded-2xl overflow-hidden select-none ${className}`}
        style={{ width: dim, height: dim }}
        onClick={onClick}
      >
        <img
          src="/apple-touch-icon.png?v=2"
          alt="JOBit - Reliable Local Services | Melattur"
          className="w-full h-full object-contain p-1"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback to jobit-logo.png or SVG if image fails
            if (e.currentTarget.src.includes('apple-touch-icon')) {
              e.currentTarget.src = '/jobit-logo.png?v=2';
            } else {
              e.currentTarget.style.display = 'none';
            }
          }}
        />
      </div>
    );
  }

  // Horizontal variant (for App Header / Navigation bars)
  if (variant === 'horizontal') {
    return (
      <div 
        className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        {/* Stacked Mini Mark: Red Location Pin + Navy Square */}
        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Top Red Pin */}
            <path d="M50 4 C40 4 32 12 32 21 C32 33 50 48 50 48 C50 48 68 33 68 21 C68 12 60 4 50 4 Z" fill="#D32F2F" />
            <circle cx="50" cy="18" r="6" fill="#FFFFFF" />

            {/* Navy Square below pin */}
            <rect x="25" y="42" width="50" height="50" rx="10" fill="#0B172E" />
            
            {/* Minimal Service Icon Accents inside */}
            {/* Spanner/hand hint */}
            <path d="M38 58 L54 74 M54 58 L38 74" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="66" r="3" fill="#D32F2F" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline font-extrabold tracking-tight">
            <span className="text-[#D32F2F] text-lg font-black font-sans">JOB</span>
            <span className="text-[#0B172E] text-lg font-black font-sans ml-0.5">it</span>
          </div>
          {showTagline && (
            <span className="text-[9px] font-bold text-[#0B172E] tracking-tight mt-0.5 opacity-90">
              Melattur Services
            </span>
          )}
        </div>
      </div>
    );
  }

  // Pure SVG Full Vector Logo (Razor Sharp, Infinite Scaling)
  const baseDim = typeof size === 'number' ? size : (sizeMap[size]?.width || 220);

  return (
    <div 
      className={`inline-flex flex-col items-center justify-center p-3 bg-white rounded-3xl select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: baseDim, maxWidth: '100%' }}
      onClick={onClick}
    >
      <svg 
        viewBox="0 0 500 500" 
        className="w-full h-auto drop-shadow-xs"
        aria-label="JOBit - Reliable Local Services | Melattur"
      >
        {/* Crisp Solid White Canvas Background */}
        <rect width="500" height="500" fill="#FFFFFF" rx="28" />

        {/* 1. VIBRANT DEEP RED LOCATION PIN */}
        <g id="red-location-pin" transform="translate(250, 95)">
          <path 
            d="M0 -55 C-26 -55 -47 -34 -47 -8 C-47 24 0 62 0 62 C0 62 47 24 47 -8 C47 -34 26 -55 0 -55 Z" 
            fill="#D32F2F" 
          />
          <circle cx="0" cy="-14" r="17" fill="#FFFFFF" />
        </g>

        {/* 2. CENTRAL NAVY BLUE SQUARED ICON BLOCK */}
        <g id="navy-icon-block" transform="translate(180, 165)">
          {/* High-contrast deep navy blue square */}
          <rect x="0" y="0" width="140" height="140" rx="22" fill="#0B172E" />

          {/* Unified White Service Silhouettes */}

          {/* Hand gripping styled spanner */}
          <g id="hand-spanner" transform="translate(70, 42)">
            <path 
              d="M-28 -14 C-25 -20 -18 -22 -12 -18 L-5 -12 L12 -24 C17 -27 24 -25 27 -20 C30 -15 28 -8 23 -5 L6 7 L12 14 C15 19 13 25 7 28 C2 30 -5 28 -8 24 Z" 
              fill="#FFFFFF" 
            />
            <path 
              d="M-12 -6 C-12 -10 -7 -12 -2 -11 C3 -10 6 -7 6 -3 C9 -3 13 -1 13 3 C14 7 11 11 8 13 L-10 13 C-13 13 -14 9 -14 5 C-14 1 -12 -3 -12 -6 Z" 
              fill="#FFFFFF" 
              stroke="#0B172E" 
              strokeWidth="2" 
            />
            <rect x="-8" y="10" width="14" height="15" rx="3" fill="#FFFFFF" />
          </g>

          {/* Simple house silhouette with checkmark */}
          <g id="house-silhouette" transform="translate(98, 48)">
            <path d="M14 -12 L0 -24 L-14 -12 L-14 12 L14 12 Z" fill="#FFFFFF" />
            <path d="M-16 -10 L0 -23 L16 -10" stroke="#0B172E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M-6 0 L-2 4 L8 -6" fill="none" stroke="#0B172E" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Lightning bolt with leaves */}
          <g id="lightning-leaves" transform="translate(104, 102)">
            <path d="M2 -22 L-8 -6 L-1 -6 L-6 8 L6 -4 L0 -4 Z" fill="#FFFFFF" />
            <path d="M5 -1 C5 -8 13 -12 18 -10 C18 -4 13 2 5 -1 Z" fill="#FFFFFF" />
            <path d="M7 4 C11 1 18 3 20 8 C15 11 9 9 7 4 Z" fill="#FFFFFF" />
          </g>

          {/* Water droplet with power symbol */}
          <g id="water-power" transform="translate(70, 104)">
            <path d="M0 -22 C-14 -6 -14 6 0 14 C14 6 14 -6 0 -22 Z" fill="#FFFFFF" />
            <path d="M-5 -2 C-7 1 -6 6 -2 8 C2 10 7 8 8 4 C9 0 7 -4 4 -6" fill="none" stroke="#0B172E" strokeWidth="2" strokeLinecap="round" />
            <line x1="0" y1="-5" x2="0" y2="1" stroke="#0B172E" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Vertical ladder silhouette */}
          <g id="ladder-silhouette" transform="translate(30, 84)">
            <line x1="-9" y1="-38" x2="-9" y2="40" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <line x1="9" y1="-38" x2="9" y2="40" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <line x1="-9" y1="-28" x2="9" y2="-28" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="-9" y1="-14" x2="9" y2="-14" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="-9" y1="0" x2="9" y2="0" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="-9" y1="14" x2="9" y2="14" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="-9" y1="28" x2="9" y2="28" stroke="#FFFFFF" strokeWidth="2.5" />
          </g>
        </g>

        {/* 3. TYPOGRAPHY: 'JOBit' (Vivid Red 'JOB' and Deep Navy Blue 'it') */}
        <g id="brand-typography" transform="translate(250, 395)">
          <text 
            textAnchor="middle" 
            fontFamily="'Outfit', 'Montserrat', 'Inter', -apple-system, sans-serif" 
            fontWeight="900" 
            fontSize="78" 
            letterSpacing="-1"
          >
            <tspan fill="#D32F2F">JOB</tspan>
            <tspan dx="4" fill="#0B172E">it</tspan>
          </text>
        </g>

        {/* 4. DETAIL TEXT: 'Reliable Local Services | Melattur' */}
        {showTagline && (
          <g id="tagline-typography" transform="translate(250, 435)">
            <text 
              textAnchor="middle" 
              fontFamily="'Outfit', 'Montserrat', 'Inter', -apple-system, sans-serif" 
              fontWeight="700" 
              fontSize="16.5" 
              fill="#0B172E" 
              letterSpacing="0.4"
            >
              Reliable Local Services | Melattur
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default JobitLogo;
