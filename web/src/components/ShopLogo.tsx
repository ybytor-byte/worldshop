'use client';

import React from 'react';

const LOGOS: Record<string, React.ReactNode> = {
  Ozon: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <circle cx="18" cy="18" r="17" fill="url(#ozongrad)" />
      <defs>
        <linearGradient id="ozongrad" x1="0" y1="0" x2="36" y2="36">
          <stop stopColor="#005BFF" />
          <stop offset="1" stopColor="#00A9FF" />
        </linearGradient>
      </defs>
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="Arial">O</text>
      <path d="M9 18a9 9 0 0118 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  ),
  Wildberries: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="8" fill="#CB11AB" />
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="Arial">W</text>
      <circle cx="18" cy="18" r="12" stroke="white" strokeWidth="1" fill="none" opacity="0.2" />
    </svg>
  ),
  DNS: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <circle cx="18" cy="18" r="17" fill="#FF6600" />
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="17" fontWeight="900" fontFamily="Arial">D</text>
      <path d="M12 13h12M12 18h12M12 23h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    </svg>
  ),
  'М.Видео': (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="6" fill="#E30613" />
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="17" fontWeight="900" fontFamily="Arial">M</text>
      <rect x="6" y="6" width="24" height="24" rx="4" stroke="white" strokeWidth="0.8" fill="none" opacity="0.25" />
    </svg>
  ),
  'Яндекс.Маркет': (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="8" fill="#FCD000" />
      <text x="18" y="23" textAnchor="middle" fill="#333" fontSize="17" fontWeight="900" fontFamily="Arial">Я</text>
      <path d="M10 14h16M10 22h16" stroke="#333" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  AliExpress: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <rect width="36" height="36" rx="8" fill="#FF4747" />
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="Arial">AE</text>
    </svg>
  ),
  Citilink: (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <circle cx="18" cy="18" r="17" fill="#00AAE5" />
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="Arial">C</text>
    </svg>
  ),
};

function defaultLogo(shop: string) {
  const initial = shop[0] || '?';
  return (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
      <circle cx="18" cy="18" r="17" fill="#6B7280" />
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="17" fontWeight="900" fontFamily="Arial">{initial}</text>
    </svg>
  );
}

export function ShopLogo({ shop, className }: { shop: string; className?: string }) {
  for (const [key, svg] of Object.entries(LOGOS)) {
    if (shop.includes(key)) {
      return <div className={className}>{svg}</div>;
    }
  }
  return <div className={className}>{defaultLogo(shop)}</div>;
}
