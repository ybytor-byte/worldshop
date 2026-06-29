'use client';

import React, { useState, use } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_DETAILS } from '../../../graphql/queries';
import { Header } from '../../../components/layout/Header';
import Link from 'next/link';

interface Offer {
  shop: string;
  price: number;
  currency: string;
  url: string;
  affiliateUrl?: string;
  scrapedAt?: string;
}

interface ProductDetails {
  id: string;
  brand: string;
  model: string;
  specs?: Record<string, unknown>;
  offers: Offer[];
}

interface GetProductDetailsData {
  product: ProductDetails;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

const REGIONS: Record<string, { label: string; flag: string }> = {
  US: { label: 'USA', flag: '🇺🇸' },
  EU: { label: 'Europe', flag: '🇪🇺' },
  ASIA: { label: 'Asia', flag: '🇨🇳' },
  RU: { label: 'Russia', flag: '🇷🇺' },
};

const DUTY_META: Record<string, { rate: number; threshold: number; currency: string }> = {
  RU: { rate: 0.15, threshold: 200, currency: '₽' },
  US: { rate: 0.10, threshold: 800, currency: '$' },
  EU: { rate: 0.19, threshold: 160, currency: '€' },
};

function CostModal({ offer, onClose }: { offer: { shop: string; price: number; url: string }; onClose: () => void }) {
  const [dest, setDest] = useState('RU');
  const meta = DUTY_META[dest];
  const shipping = Math.round(offer.price * 0.05);
  let duty = 0;
  if (offer.price > meta.threshold) {
    duty = Math.round((offer.price - meta.threshold) * meta.rate);
  }
  const total = offer.price + shipping + duty;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-[modalScaleIn_0.3s_cubic-bezier(0.25,0.8,0.25,1)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Расчёт полной стоимости
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Страна доставки</label>
            <select value={dest} onChange={(e) => setDest(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400">
              {Object.entries(DUTY_META).map(([k, v]) => (
                <option key={k} value={k}>{k === 'RU' ? 'Россия' : k === 'US' ? 'США' : 'Германия (EU)'} ({v.currency})</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Цена товара</span>
              <strong className="text-gray-900">{offer.price.toLocaleString()} ₽</strong>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Международная доставка (~5%)</span>
              <strong className="text-blue-600">{shipping.toLocaleString()} ₽</strong>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Таможенная пошлина</span>
              <strong className={duty > 0 ? 'text-orange-500' : 'text-green-600'}>{duty > 0 ? `${duty.toLocaleString()} ₽` : '0 ₽ (под лимитом)'}</strong>
            </div>
            {duty > 0 && <p className="text-[11px] text-gray-400">Лимит: {meta.threshold} {meta.currency}</p>}
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>ИТОГО</span>
              <span className="text-lg text-green-600">{total.toLocaleString()} ₽</span>
            </div>
          </div>

          <a href={offer.url} target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
            Перейти в магазин
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const [selectedOffer, setSelectedOffer] = useState<{ shop: string; price: number; url: string } | null>(null);

  const { data, loading, error } = useQuery<GetProductDetailsData>(GET_PRODUCT_DETAILS, {
    variables: { id },
  });

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <span className="text-xs text-gray-500 font-medium">Загрузка информации о товаре...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !data?.product) {
    return (
      <>
        <Header />
        <div className="mx-auto w-full max-w-7xl px-4 py-20 text-center">
          <div className="rounded-xl bg-red-50 border border-red-100 p-8 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-red-700">Товар не найден</h3>
            <p className="mt-2 text-xs text-red-500">
              Не удалось загрузить карточку товара. Возможно, неверный ID или сервер недоступен.
            </p>
            <Link href="/" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700">На главную</Link>
          </div>
        </div>
      </>
    );
  }

  const { brand, model, specs, offers } = data.product;
  const lowestPrice = offers.length > 0 ? Math.min(...offers.map((o) => o.price)) : 0;
  const specsEntries = Object.entries(specs || {}).filter(([, val]) => val !== null && val !== undefined && val !== '');

  return (
    <>
      <Header />
      {selectedOffer && <CostModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />}
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-6 text-xs text-gray-400 font-medium">
          <Link href="/" className="hover:text-blue-500">Главная</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{brand} {model}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
                {brand} <span className="text-gray-700">{model}</span>
              </h1>
              {lowestPrice > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold bg-green-50 text-green-700 border border-green-100 rounded-lg px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                  Минимальная цена: {lowestPrice.toLocaleString()} ₽
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Характеристики</h3>
              {specsEntries.length > 0 ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {specsEntries.map(([key, value]) => (
                    <div key={key} className="border-b border-gray-50 pb-2">
                      <dt className="text-xs font-semibold text-gray-400 capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="text-sm font-semibold text-gray-700 mt-1">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-gray-400">Характеристики для этого товара не извлечены ИИ.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md">
              <h3 className="text-lg font-extrabold text-gray-900 mb-4 border-b pb-2">Где купить</h3>
              <div className="flex flex-col gap-3">
                {offers.length > 0 ? offers.map((offer, idx) => (
                  <div key={idx}
                    className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/20 transition-all cursor-pointer"
                    onClick={() => setSelectedOffer(offer)}
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{offer.shop}</div>
                      <div className="text-lg font-extrabold text-gray-900 mt-1">{offer.price.toLocaleString()} ₽</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedOffer(offer); }}
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 shadow-sm active:scale-[0.98] transition-all"
                    >
                      Детали
                    </button>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400 text-center py-6">Предложения от магазинов отсутствуют.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
