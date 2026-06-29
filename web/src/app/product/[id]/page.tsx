'use client';

import React, { useState, use } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_PRODUCT_DETAILS } from '../../../graphql/queries';
import { Header } from '../../../components/layout/Header';
import { ShopLogo } from '../../../components/ShopLogo';
import Link from 'next/link';

interface Offer {
  shop: string;
  price: number;
  currency: string;
  url: string;
  variant: string;
  affiliateUrl?: string;
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

function formatPrice(n: number) {
  return Math.round(n).toLocaleString('ru-RU');
}

function OfferCard({ offer, variantName }: { offer: Offer; variantName: string }) {
  const [expanded, setExpanded] = useState(false);
  const shipping = Math.round(offer.price * 0.05);
  const dutyThreshold = 200;
  const duty = offer.price > dutyThreshold ? Math.round((offer.price - dutyThreshold) * 0.15) : 0;
  const total = offer.price + shipping + duty;

  return (
    <div className={`border rounded-xl transition-all ${expanded ? 'border-blue-200 bg-blue-50/20' : 'border-gray-100 hover:border-blue-100 hover:bg-gray-50/40'}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <ShopLogo shop={offer.shop} />
          <div>
            <div className="text-sm font-bold text-gray-900">{offer.shop}</div>
            <div className="text-lg font-extrabold text-gray-900 mt-0.5">{formatPrice(offer.price)} ₽</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!expanded && (
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg">С расчётом</span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-blue-100">
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white rounded-xl p-3.5 border border-gray-100 text-center shadow-sm">
              <svg className="w-6 h-6 mx-auto text-blue-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <div className="text-xs font-semibold text-gray-500">Доставка</div>
              <div className="text-base font-bold text-blue-600 mt-0.5">{formatPrice(shipping)} ₽</div>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-gray-100 text-center shadow-sm">
              <svg className="w-6 h-6 mx-auto text-orange-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-7m0 0l-7 7m7-7V3" />
              </svg>
              <div className="text-xs font-semibold text-gray-500">Пошлина</div>
              <div className={`text-base font-bold mt-0.5 ${duty > 0 ? 'text-orange-600' : 'text-green-600'}`}>{duty > 0 ? `${formatPrice(duty)} ₽` : '0 ₽'}</div>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-gray-100 text-center shadow-sm">
              <svg className="w-6 h-6 mx-auto text-green-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs font-semibold text-gray-500">Итого</div>
              <div className="text-base font-bold text-green-600 mt-0.5">{formatPrice(total)} ₽</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Вариант:</span> {variantName}
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Таможня:</span> лимит 200€, ставка 15%
            </div>
          </div>

          <a href={offer.url} target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            Перейти в магазин
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const [selectedVariant, setSelectedVariant] = useState<string>('');

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
            <p className="mt-2 text-xs text-red-500">Не удалось загрузить карточку товара.</p>
            <Link href="/" className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700">На главную</Link>
          </div>
        </div>
      </>
    );
  }

  const { brand, model, specs, offers } = data.product;
  const variants = [...new Set(offers.map((o) => o.variant).filter(Boolean))];
  const activeVariant = selectedVariant || variants[0] || '';
  const filteredOffers = offers.filter((o) => o.variant === activeVariant);
  const lowestPrice = filteredOffers.length > 0 ? Math.min(...filteredOffers.map((o) => o.price)) : 0;
  const specsEntries = Object.entries(specs || {}).filter(([, val]) => val !== null && val !== undefined && val !== '');

  return (
    <>
      <Header />
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
                  {activeVariant}: от {formatPrice(lowestPrice)} ₽
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
                <p className="text-xs text-gray-400">Характеристики не загружены.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-gray-900">Где купить</h3>

            {variants.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button key={v}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeVariant === v
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            {filteredOffers.length > 0 ? (
              filteredOffers.map((offer, idx) => (
                <OfferCard key={idx} offer={offer} variantName={activeVariant} />
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6 bg-white rounded-xl border border-gray-100">
                {offers.length === 0 ? 'Предложений нет' : `Нет предложений для варианта "${activeVariant}"`}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 