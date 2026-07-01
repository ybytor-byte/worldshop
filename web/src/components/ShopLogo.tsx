'use client';

import React from 'react';

const LOGOS: Record<string, React.ReactNode> = {
  Ozon: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="10" fill="#005BFF" />
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="26" fontWeight="800" fontFamily="Arial">O</text>
      <path d="M12 24a12 12 0 0124 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  ),
  Wildberries: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill="#CB11AB" />
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="Arial">WB</text>
    </svg>
  ),
  DNS: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill="#FF6600" />
      <rect x="6" y="6" width="36" height="36" rx="4" fill="white" fillOpacity="0.15" />
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="Arial">DNS</text>
    </svg>
  ),
  'М.Видео': (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill="#E30613" />
      <circle cx="24" cy="24" r="12" fill="white" fillOpacity="0.15" />
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="24" fontWeight="900" fontFamily="Arial">M</text>
    </svg>
  ),
  'Яндекс.Маркет': (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill="#FCD000" />
      <text x="24" y="33" textAnchor="middle" fill="#E30613" fontSize="24" fontWeight="900" fontFamily="Arial">Я</text>
      <circle cx="24" cy="24" r="16" stroke="#333" strokeWidth="0.5" opacity="0.1" />
    </svg>
  ),
  AliExpress: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill="#FF4747" />
      <path d="M10 20h6l3 10 3-10h6l3 10 3-10h6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="24" y="36" textAnchor="middle" fill="white" fontSize="9" fontWeight="600" fontFamily="Arial">ALIEXPRESS</text>
    </svg>
  ),
  Citilink: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill="#00AAE5" />
      <circle cx="24" cy="24" r="14" fill="white" fillOpacity="0.15" />
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="Arial">C</text>
    </svg>
  ),
  Amazon: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill="#232F3E" />
      <text x="24" y="28" textAnchor="middle" fill="#FF9900" fontSize="16" fontWeight="800" fontFamily="Arial">amazon</text>
      <path d="M14 32c4 2 10 3 16 1l-2-4" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  MediaMarkt: (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill="#E30613" />
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Arial">MM</text>
      <text x="24" y="40" textAnchor="middle" fill="white" fontSize="6" fontWeight="600" fontFamily="Arial">MEDIAMARKT</text>
    </svg>
  ),
};

function defaultLogo(shop: string) {
  const initial = shop[0] || '?';
  const color = '#6B7280';
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="8" fill={color} />
      <text x="24" y="32" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="Arial">{initial}</text>
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
