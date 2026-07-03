'use client';

import React, { useState } from 'react';

const REGION_LABELS: Record<string, string> = { RU: '🇷🇺 Россия', US: '🇺🇸 США', EU: '🇪🇺 Европа', ASIA: '🇨🇳 Азия' };
const REGION_COLORS: Record<string, string> = { RU: '#3b82f6', US: '#ef4444', EU: '#f59e0b', ASIA: '#10b981' };

export default function OffersByRegion({ offers }: { offers: any[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ RU: true, EU: false, US: false, ASIA: false });

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

  return (
    <div className="space-y-2">
      {regionOrder.map(region => {
        const minPrice = Math.min(...grouped[region].map((o: any) => o.finalPrice || Infinity));
        const sorted = [...grouped[region]].sort((a: any, b: any) => (a.finalPrice || 0) - (b.finalPrice || 0));
        const isOpen = expanded[region];
        const color = REGION_COLORS[region] || '#6b7280';

        return (
          <div
            key={region}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: isOpen ? color : 'var(--border-color)', background: 'var(--bg-card)' }}
          >
            <button
              className="flex items-center justify-between w-full px-3.5 py-2.5 text-left transition-colors hover:bg-theme-card-hover"
              onClick={() => setExpanded({ ...expanded, [region]: !isOpen })}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide"
                  style={{ background: `${color}18`, color }}
                >
                  {region}
                </span>
                <span className="text-xs font-semibold text-theme-primary">
                  {REGION_LABELS[region] || region}
                </span>
                <span className="text-xs font-bold" style={{ color }}>
                  от {minPrice.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <svg
                className="w-3.5 h-3.5 text-theme-muted shrink-0 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isOpen && (
              <div>
                {sorted.map((offer: any, i: number) => {
                  const priceRub = offer.priceInRub
                    ? `${Number(offer.priceInRub).toLocaleString('ru-RU')} ₽`
                    : '';
                  const shipping =
                    offer.shipping > 0
                      ? `+ ${Number(offer.shipping).toLocaleString('ru-RU')} ₽`
                      : '';
                  const customs =
                    offer.customsDuty > 0
                      ? `+ ${Number(offer.customsDuty).toLocaleString('ru-RU')} ₽`
                      : '';
                  const finalPrice = offer.finalPrice
                    ? `${Number(offer.finalPrice).toLocaleString('ru-RU')} ₽`
                    : '';
                  return (
                    <a
                      key={i}
                      href={offer.url}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center px-3.5 py-2 border-t text-xs transition-colors hover:bg-theme-card-hover"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-theme-primary truncate">
                            {offer.shop}
                          </span>
                          <span className="font-bold shrink-0" style={{ color }}>
                            {finalPrice}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5 text-[10px] text-theme-muted">
                          <span>{priceRub}</span>
                          {shipping && <span>{shipping} дост.</span>}
                          {customs && <span>{customs} пошл.</span>}
                          {offer.deliveryDays && <span>• {offer.deliveryDays}</span>}
                        </div>
                      </div>
                      <svg
                        className="h-3 w-3 text-theme-muted shrink-0 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
