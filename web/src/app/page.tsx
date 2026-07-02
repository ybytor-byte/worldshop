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
  const [phase, setPhase] = useState<'idle' | 'preview' | 'scanning' | 'done'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setPreview(null);
    setStatusText('');
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
    setPhase('scanning');
    setStatusText('Ищем товар через Google Lens...');

    const form = new FormData();
    form.append('image', file);
    try {
      const res = await fetch(
        'https://worldshopbackend-production.up.railway.app/search-by-image',
        { method: 'POST', body: form }
      );
      const data = await res.json();
      setPhase('done');
      onResult(data);
    } catch {
      setPhase('idle');
      setPreview(null);
      onResult({ error: 'Ошибка соединения с сервером', message: 'Не удалось подключиться к https://worldshopbackend-production.up.railway.app/search-by-image' });
    }
  }, [onResult]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processImage(f);
  }, [processImage]);

  return (
    <div className="relative">
      {phase === 'idle' ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-theme hover:border-blue-300 bg-theme-card shadow-theme'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processImage(f); }}
          />
          <div style={{ color: 'var(--text-muted)' }}>
            <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Перетащите фото товара или нажмите для выбора</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Найдите товар по фото и узнайте, где дешевле</p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-theme shadow-theme bg-theme-card">
          {/* Image preview */}
          {preview && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full max-h-48 object-contain p-3" />

              {phase === 'scanning' && (
                <div className="scan-overlay" style={{ background: 'color-mix(in srgb, var(--bg-primary) 70%, transparent)' }}>
                  <div className="scan-line" />
                  <div className="scan-label">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {statusText}
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 'done' && (
            <div className="flex justify-end px-3 pb-3">
              <button onClick={reset} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', color: '#ef4444', border: '1px solid color-mix(in srgb, #ef4444 25%, transparent)' }}>
                ✕ Очистить
              </button>
            </div>
          )}
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

  const [fetchProducts, { data, loading }] = useLazyQuery<GetProductsData>(GET_PRODUCTS);

  useEffect(() => {
    if (search.trim().length >= 2) {
      const timer = setTimeout(() => {
        fetchProducts({ variables: { search } });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, fetchProducts]);

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
      const firstResult = data?.products?.[0];
      if (firstResult) {
        router.push(`/product/${firstResult.id}`);
      } else {
        setShowSuggestions(true);
      }
    }
  };

  const suggestions: ProductSearchResult[] = data?.products || [];

  return (
    <>
      <Header />
      <section className="relative flex-1 flex flex-col justify-center items-center py-20 px-4 text-center overflow-hidden bg-theme-section">
        <div className="absolute inset-0 -z-10 opacity-30" style={{ background: 'radial-gradient(45rem 50rem at top, var(--accent-primary), transparent)' }} />

        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-theme-primary">
            Сравнение цен на товары с <span className="gradient-text">ИИ-аналитикой</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto text-theme-secondary">
            Ищите товары по названию или вставляйте ссылки с Ozon, Wildberries, МВидео, DNS и Яндекс.Маркета для мгновенного матчинга цен.
          </p>

          <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto mt-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative flex items-center rounded-2xl shadow-theme border p-1.5 focus-within:ring-2 transition-all bg-theme-card border-theme" style={{ '--tw-ring-color': 'var(--accent-primary)' } as React.CSSProperties}>
                <div className="pl-3.5 pr-2.5 text-theme-muted">
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
                  className="flex-1 text-sm outline-none py-2 pr-4 bg-transparent text-theme-primary"
                  style={{ '--tw-placeholder-color': 'var(--text-muted)' } as React.CSSProperties}
                />
                <button
                  type="submit"
                  className="rounded-xl font-semibold text-sm text-white px-5 py-2.5 shadow transition-all active:scale-[0.98] btn-gradient"
                >
                  Поиск
                </button>
              </div>
            </form>

            {showSuggestions && search.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl shadow-xl overflow-hidden text-left max-h-72 overflow-y-auto bg-theme-card border border-theme shadow-theme">
                {loading && (
                  <div className="p-4 text-xs font-medium text-center flex items-center justify-center gap-2 text-theme-muted">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 spinner-theme" />
                    Поиск...
                  </div>
                )}

                {!loading && suggestions.length === 0 && (
                  <div className="p-4 text-xs text-center text-theme-muted">Товары не найдены</div>
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
                      className="w-full flex items-center justify-between px-5 py-3.5 border-b text-left transition-colors border-theme hover:bg-theme-card-hover"
                    >
                      <div>
                        <div className="text-sm font-bold text-theme-primary">{product.brand} {product.model}</div>
                        <div className="text-[10px] mt-0.5 text-theme-muted">Предложений: {product.offers.length}</div>
                      </div>
                      <div className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ color: 'var(--accent-primary)', background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' }}>
                        от {minPrice.toLocaleString()} ₽
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 max-w-md mx-auto w-full">
            <ImageUpload onResult={setImageResult} />

            {imageResult && !imageResult.error && (
              <div className="mt-3 rounded-xl border shadow-theme p-4 text-left bg-theme-card border-theme">
                {imageResult.identified ? (
                  <>
                    <p className="text-sm font-semibold text-theme-primary">
                      {imageResult.productName || ''}
                    </p>

                    {(imageResult.offers?.length > 0) && (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-theme-muted">Предложения</p>
                          {imageResult.offers.map((offer: any, i: number) => {
                            const name = offer.shop || offer.name;
                            const url = offer.url;
                            const price = offer.price ? `${Number(offer.price).toLocaleString('ru-RU')} ₽` : '';
                            const shipping = offer.shipping ? `+ ${Number(offer.shipping).toLocaleString('ru-RU')} ₽ дост.` : '';
                            const duty = offer.duty && offer.duty > 0 ? `+ ${Number(offer.duty).toLocaleString('ru-RU')} ₽ пошл.` : '';
                            const total = offer.totalPrice ? `= ${Number(offer.totalPrice).toLocaleString('ru-RU')} ₽` : '';
                            const rank = offer.rank ? `#${offer.rank}` : '';
                            return (
                              <a key={i} href={url} target="_blank" rel="noopener"
                                className="flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors bg-theme-card-hover"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    {rank && <span className="text-[10px] font-bold text-theme-muted">{rank}</span>}
                                    <span className="text-theme-primary font-medium truncate">{name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                    {price && <span className="text-xs font-bold">{price}</span>}
                                    {shipping && <span className="text-[10px] text-theme-muted">{shipping}</span>}
                                    {duty && <span className="text-[10px] text-theme-muted">{duty}</span>}
                                    {total && <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{total}</span>}
                                  </div>
                                </div>
                                <svg className="h-3.5 w-3.5 text-theme-muted shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            );
                          })}
                        </div>
                      )}
                  </>
                ) : (
                  <p className="text-xs text-theme-secondary">{imageResult.message || 'Не удалось распознать товар'}</p>
                )}
              </div>
            )}

            {imageResult?.error && (
              <div className="mt-3 rounded-xl border p-3 text-center" style={{ background: 'color-mix(in srgb, #ef4444 10%, var(--bg-card))', borderColor: 'color-mix(in srgb, #ef4444 20%, var(--border-color))' }}>
                <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{imageResult.error}</p>
                {imageResult.message && <p className="text-[11px] mt-0.5" style={{ color: '#f87171' }}>{imageResult.message}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center p-6 rounded-2xl border shadow-theme bg-theme-card border-theme">
              <div className="rounded-2xl p-3 mb-4" style={{ background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', color: 'var(--accent-primary)' }}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2 text-theme-primary">Мгновенный ИИ-анализ</h3>
              <p className="text-xs text-center leading-relaxed text-theme-secondary">
                ИИ автоматически определяет бренд, модель и технические характеристики, отбрасывая рекламный мусор с веб-страниц.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl border shadow-theme bg-theme-card border-theme">
              <div className="rounded-2xl p-3 mb-4" style={{ background: 'color-mix(in srgb, #10b981 15%, transparent)', color: '#10b981' }}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2 text-theme-primary">Единый мониторинг цен</h3>
              <p className="text-xs text-center leading-relaxed text-theme-secondary">
                Склеивайте цены на идентичные товары из разных магазинов в единую карточку с историей изменений.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-2xl border shadow-theme bg-theme-card border-theme">
              <div className="rounded-2xl p-3 mb-4" style={{ background: 'color-mix(in srgb, #6366f1 15%, transparent)', color: '#6366f1' }}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold mb-2 text-theme-primary">Кэшбэк и выгода</h3>
              <p className="text-xs text-center leading-relaxed text-theme-secondary">
                Сгенерированные редирект-ссылки ведут на официальные программы CPA, обеспечивая безопасность сделок.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
