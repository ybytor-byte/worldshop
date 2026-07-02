'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../../store/hooks';
import { Header } from '../../components/layout/Header';
import Link from 'next/link';

interface ScanItem {
  id: string;
  url: string;
  shop: string;
  title: string;
  status: string;
  error: string | null;
  productId: string | null;
  createdAt: string;
  product?: {
    brand: string;
    model: string;
    prices: Array<{ price: number }>;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken, email } = useAppSelector((state) => state.auth);
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
      return;
    }

    const fetchScans = async () => {
      try {
        const response = await fetch(`https://worldshopbackend-production.up.railway.app/products/ingests/my`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Не удалось загрузить историю сравнений');
        }

        const data = await response.json();
        setScans(data);
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [isAuthenticated, accessToken, router]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 sm:truncate sm:text-3xl tracking-tight text-theme-primary">
              Личный кабинет
            </h2>
            <p className="mt-1.5 text-sm text-theme-secondary">
              Почта профиля: <span className="font-semibold text-theme-primary">{email}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-theme"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl border p-4 text-sm font-semibold" style={{ background: 'color-mix(in srgb, #ef4444 15%, transparent)', borderColor: 'color-mix(in srgb, #ef4444 25%, transparent)', color: '#ef4444' }}>
            {error}
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center rounded-2xl border border-dashed py-16 px-4 bg-theme-card border-theme">
            <svg className="mx-auto h-12 w-12 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-theme-primary">История сканирований пуста</h3>
            <p className="mt-1 text-xs max-w-sm mx-auto text-theme-secondary">
              Используйте расширение WorldShop для Chrome на Ozon, Wildberries и др., чтобы добавлять товары для автоматического сравнения.
            </p>
          </div>
        ) : (
          <div className="shadow-theme border rounded-2xl overflow-hidden bg-theme-card border-theme">
            <div className="px-6 py-4 border-b bg-theme-card-hover border-theme">
              <h3 className="text-sm font-bold text-theme-primary">История сканирований и сравнений</h3>
            </div>
            <ul role="list" className="divide-y divide-theme" style={{ borderColor: 'var(--border-color)' }}>
              {scans.map((s) => {
                const dateString = new Date(s.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <li key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-x-6 gap-y-4 px-6 py-5 hover:bg-theme-card-hover transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-x-3">
                        <p className="text-sm font-semibold leading-6 truncate max-w-[280px] sm:max-w-md text-theme-primary">
                          {s.title}
                        </p>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                          s.status === 'completed'
                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                            : s.status === 'failed'
                            ? 'bg-red-50 text-red-700 ring-red-600/20'
                            : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                        }`}>
                          {s.status === 'completed' ? 'Готово' : s.status === 'failed' ? 'Ошибка ИИ' : 'Обработка'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-theme-muted">
                        <span className="font-semibold text-theme-secondary uppercase">{s.shop}</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span>{dateString}</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate max-w-[180px]" style={{ color: 'var(--accent-primary)' }}
                        >
                          Перейти к источнику
                        </a>
                      </div>
                      {s.error && (
                        <p className="mt-2 text-xs font-semibold" style={{ color: '#ef4444' }}>
                          Ошибка: {s.error}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-none items-center gap-x-4">
                      {s.status === 'completed' && s.productId && (
                        <Link
                          href={`/product/${s.productId}`}
                          className="rounded-lg px-3 py-2 text-xs font-bold shadow-sm transition-all active:scale-[0.98] text-white btn-gradient"
                        >
                          Смотреть сравнение
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
