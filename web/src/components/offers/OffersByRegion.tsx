'use client';

import React, { useState } from 'react';

const REGION_LABELS: Record<string, string> = { RU: '🇷🇺 Россия', US: '🇺🇸 США', EU: '🇪🇺 Европа', ASIA: '🇨🇳 Азия' };
const REGION_COLORS: Record<string, string> = { RU: '#3b82f6', US: '#ef4444', EU: '#f59e0b', ASIA: '#10b981' };

function OfferCard({ offer, color }: { offer: any; color: string }) {
  const priceRub = offer.priceInRub ? `${Number(offer.priceInRub).toLocaleString('ru-RU')} ₽` : '';
  const shipping = offer.shipping > 0 ? `+ ${Number(offer.shipping).toLocaleString('ru-RU')} ₽` : '';
  const customs = offer.customsDuty > 0 ? `+ ${Number(offer.customsDuty).toLocaleString('ru-RU')} ₽` : '';
  const finalPrice = offer.finalPrice ? `${Number(offer.finalPrice).toLocaleString('ru-RU')} ₽` : '';

  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener"
      className="flex flex-col gap-2 p-4 rounded-xl border transition-all active:scale-[0.97] hover:brightness-110"
      style={{
        borderColor: 'var(--border-color)',
        background: 'var(--bg-card)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md truncate max-w-[120px]" style={{ background: `${color}18`, color }}>
          {offer.region}
        </span>
        <span className="text-sm font-semibold truncate text-theme-primary">{offer.shop}</span>
      </div>

      <div className="text-xl font-extrabold tracking-tight" style={{ color }}>
        {finalPrice}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-theme-muted">
        <span>{priceRub}</span>
        {shipping && <span>{shipping} дост.</span>}
        {customs && <span>{customs} пошл.</span>}
      </div>

      {offer.deliveryDays && (
        <div className="text-xs text-theme-muted flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {offer.deliveryDays}
        </div>
      )}
    </a>
  );
}

export default function OffersByRegion({ offers }: { offers: any[] }) {
  const [selected, setSelected] = useState<string | null>('RU');

  const grouped: Record<string, any[]> = {};
  for (const o of offers) {
    const r = o.region || 'RU';
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(o);
  }

  const regionOrder = Object.keys(grouped).sort((a, b) => {
    if (a === 'RU') return -1;
    if (b === 'RU') return 1;
    const minA = Math.min(...grouped[a].map((o: any) => o.finalPrice || Infinity));
    const minB = Math.min(...grouped[b].map((o: any) => o.finalPrice || Infinity));
    return minA - minB;
  });

  const selectedRegion = selected && grouped[selected] ? selected : null;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {regionOrder.map(region => {
          const minPrice = Math.min(...grouped[region].map((o: any) => o.finalPrice || Infinity));
          const count = grouped[region].length;
          const isActive = selected === region;
          const color = REGION_COLORS[region] || '#6b7280';

          return (
            <button
              key={region}
              onClick={() => setSelected(isActive ? null : region)}
              className="flex flex-col items-start gap-1 p-4 rounded-2xl border text-sm font-semibold transition-all active:scale-[0.97] min-w-[140px]"
              style={{
                borderColor: isActive ? color : 'var(--border-color)',
                background: isActive ? `${color}12` : 'var(--bg-card)',
                color: isActive ? color : 'var(--text-primary)',
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: `${color}18`, color }}>
                  {region}
                </span>
                <span className="text-xs opacity-60 ml-auto">{count} тов.</span>
              </div>
              <span className="text-base truncate w-full">{REGION_LABELS[region] || region}</span>
              <span className="text-lg font-bold" style={{ color }}>от {minPrice.toLocaleString('ru-RU')} ₽</span>
            </button>
          );
        })}
      </div>

      {selectedRegion && (
        <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {grouped[selectedRegion]
            .sort((a: any, b: any) => (a.finalPrice || 0) - (b.finalPrice || 0))
            .map((offer: any, i: number) => (
              <OfferCard key={i} offer={offer} color={REGION_COLORS[selectedRegion] || '#6b7280'} />
            ))}
        </div>
      )}
    </div>
  );
}
