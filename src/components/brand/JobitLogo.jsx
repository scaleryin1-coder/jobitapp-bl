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
 *   - 'JOB' (ALL CAPS, bold) in deep Navy Blue (#0B172E)
 *   - 'it' (bold) in rich Red (#D32F2F)
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
  if (variant === 'image' || variant === 'full') {
    const dim = typeof size === 'number' ? size : (sizeMap[size]?.width || 200);
    return (
      <div 
        className={`inline-flex items-center justify-center bg-white rounded-2xl overflow-hidden select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        style={{ width: dim, maxWidth: '100%' }}
        onClick={onClick}
      >
        <img
          src="/jobit-logo.png?v=3"
          alt="JOBit - Reliable Service Partner"
          className="w-full h-auto object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Mark / Icon only variant
  if (variant === 'mark' || variant === 'compact') {
    const dim = typeof size === 'number' ? size : (sizeMap[size]?.width || 44);
    return (
      <div 
        className={`inline-flex items-center justify-center bg-white rounded-xl overflow-hidden select-none shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        style={{ width: dim, height: dim }}
        onClick={onClick}
      >
        <img
          src="/apple-touch-icon.png?v=3"
          alt="JOBit Icon"
          className="w-full h-full object-contain p-0.5"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Text only variant
  if (variant === 'text') {
    return (
      <div 
        className={`inline-flex items-center select-none font-sans font-black tracking-tight ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <span className="text-[#0B2559]">JOB</span>
        <span className="text-[#E50914] ml-0.5">it</span>
      </div>
    );
  }

  // Horizontal variant (for App Header / Navigation bars / Welcome Screen Badge)
  return (
    <div 
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <img
        src="/jobit-logo.png?v=3"
        alt="JOBit - Reliable Service Partner"
        className="h-8 sm:h-9 w-auto max-w-[170px] object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default JobitLogo;

