'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client/react';
import { GET_PRODUCTS } from '../graphql/queries';
import { Header } from '../components/layout/Header';

interface ProductSearchResult {
  id: string;
  brand: string;
  model: string;
  offers: Array<{ price: number; shop: string }>;
}

interface GetProductsData {
  products: ProductSearchResult[];
}

function ImageUpload({ onResult }: { onResult: (data: any) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/search-by-image`, { method: 'POST', body: form });
      const data = await res.json();
      onResult(data);
    } catch { onResult({ error: 'Ошибка соединения с сервером', message: 'Проверьте, запущен ли бэкенд на :3001' }) }
    setLoading(false);
  }, [onResult]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) upload(f);
  }, [upload]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
    >
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Анализируем фото...</span>
        </div>
      ) : (
        <div className="text-gray-400">
          <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">Перетащите фото товара или нажмите для выбора</p>
          <p className="text-xs text-gray-400 mt-1">Найдите товар по фото и узнайте, где дешевле</p>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [imageResult, setImageResult] = useState<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Lazy query to fetch autocomplete items
  const [fetchProducts, { data, loading }] = useLazyQuery<GetProductsData>(GET_PRODUCTS);

  // Debounced search trigger
  useEffect(() => {
    if (search.trim().length >= 2) {
      const timer = setTimeout(() => {
        fetchProducts({ variables: { search } });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, fetchProducts]);

  // Close suggestions click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      // Find exact match in results or redirect to lists
      const firstResult = data?.products?.[0];
      if (firstResult) {
        router.push(`/product/${firstResult.id}`);
      } else {
        // Fallback to searching
        setShowSuggestions(true);
      }
    }
  };

  const suggestions: ProductSearchResult[] = data?.products || [];

  return (
    <>
      <Header />
      
      {/* Hero section */}
      <section className="relative flex-1 flex flex-col justify-center items-center py-20 px-4 text-center overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.100),theme(colors.white))] opacity-40" />

        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-950 sm:text-6xl">
            Сравнение цен на товары с <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ИИ-аналитикой</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
            Ищите товары по названию или вставляйте ссылки с Ozon, Wildberries, МВидео, DNS и Яндекс.Маркета для мгновенного матчинга цен.
          </p>

          {/* Search bar with Autocomplete */}
          <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto mt-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-gray-200/80 p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                <div className="pl-3.5 pr-2.5 text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Введите бренд или модель (например, iPhone 16)..."
                  className="flex-1 text-sm text-gray-800 outline-none py-2 pr-4 bg-transparent placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm text-white px-5 py-2.5 shadow transition-colors active:scale-[0.98]"
                >
                  Поиск
                </button>
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {showSuggestions && search.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden text-left max-h-72 overflow-y-auto">
                {loading && (
                  <div className="p-4 text-xs text-gray-400 font-medium text-center flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    Поиск...
                  </div>
                )}
                
                {!loading && suggestions.length === 0 && (
                  <div className="p-4 text-xs text-gray-500 text-center">Товары не найдены</div>
                )}

                {!loading && suggestions.map((product) => {
                  const minPrice = product.offers.length > 0
                    ? Math.min(...product.offers.map((o) => o.price))
                    : 0;

                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        router.push(`/product/${product.id}`);
                        setShowSuggestions(false);
                      }}
                      className="w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div>
                        <div className="text-sm font-bold text-gray-900">{product.brand} {product.model}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Предложений: {product.offers.length}</div>
                      </div>
                      <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        от {minPrice.toLocaleString()} ₽
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Photo Upload */}
          <div className="mt-6 max-w-md mx-auto w-full">
            <ImageUpload onResult={setImageResult} />

            {imageResult && !imageResult.error && (
              <div className="mt-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left">
                {imageResult.identified ? (
                  <>
                    <p className="text-sm font-semibold text-gray-900">{imageResult.brand} {imageResult.model}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{imageResult.description}</p>
                    {imageResult.shops?.length > 0 ? (
                      <div className="mt-3 space-y-1.5">
                        {imageResult.shops.map((shop: any, i: number) => (
                          <a key={i} href={shop.url} target="_blank" rel="noopener"
                            className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors"
                          >
                            <span className="text-gray-700">{shop.name}</span>
                            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">Магазины не найдены — добавьте товар через расширение</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500">{imageResult.message || 'Не удалось распознать товар'}</p>
                )}
              </div>
            )}

            {imageResult?.error && (
              <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                <p className="text-xs font-medium text-red-600">{imageResult.error}</p>
                {imageResult.message && <p className="text-[11px] text-red-400 mt-0.5">{imageResult.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Мгновенный ИИ-анализ</h3>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                ИИ автоматически определяет бренд, модель и технические характеристики, отбрасывая рекламный мусор с веб-страниц.
              </p>
            </div>
            <div className="flex flex-col items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="rounded-2xl bg-green-50 p-3 text-green-600 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Единый мониторинг цен</h3>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Склеивайте цены на идентичные товары из разных магазинов в единую карточку с историей изменений.
              </p>
            </div>
            <div className="flex flex-col items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Кэшбэк и выгода</h3>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Сгенерированные редирект-ссылки ведут на официальные программы CPA, обеспечивая безопасность сделок.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
