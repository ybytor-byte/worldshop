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
      className="flex flex-col gap-1.5 p-3 rounded-xl border transition-all active:scale-[0.97] hover:brightness-110"
      style={{
        borderColor: 'var(--border-color)',
        background: 'var(--bg-card)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate max-w-[100px]" style={{ background: `${color}18`, color }}>
          {offer.region}
        </span>
        <span className="text-xs font-semibold truncate text-theme-primary">{offer.shop}</span>
      </div>

      <div className="text-lg font-extrabold tracking-tight" style={{ color }}>
        {finalPrice}
      </div>

      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-theme-muted">
        <span>{priceRub}</span>
        {shipping && <span>{shipping} дост.</span>}
        {customs && <span>{customs} пошл.</span>}
      </div>

      {offer.deliveryDays && (
        <div className="text-[10px] text-theme-muted flex items-center gap-1">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="flex flex-wrap gap-2">
        {regionOrder.map(region => {
          const minPrice = Math.min(...grouped[region].map((o: any) => o.finalPrice || Infinity));
          const count = grouped[region].length;
          const isActive = selected === region;
          const color = REGION_COLORS[region] || '#6b7280';

          return (
            <button
              key={region}
              onClick={() => setSelected(isActive ? null : region)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97]"
              style={{
                borderColor: isActive ? color : 'var(--border-color)',
                background: isActive ? `${color}12` : 'var(--bg-card)',
                color: isActive ? color : 'var(--text-primary)',
              }}
            >
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${color}18`, color }}>
                {region}
              </span>
              <span className="truncate max-w-[100px]">{REGION_LABELS[region] || region}</span>
              <span className="font-bold" style={{ color }}>от {minPrice.toLocaleString('ru-RU')} ₽</span>
              <span className="text-[10px] opacity-60">{count} тов.</span>
              <svg
                className="w-3 h-3 shrink-0 transition-transform duration-200"
                style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          );
        })}
      </div>

      {selectedRegion && (
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
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
