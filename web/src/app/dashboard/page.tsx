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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products/ingests/my`, {
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
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl tracking-tight">
              Личный кабинет
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Почта профиля: <span className="font-semibold text-gray-700">{email}</span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center bg-white rounded-2xl border border-dashed border-gray-300 py-16 px-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-950">История сканирований пуста</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              Используйте расширение WorldShop для Chrome на Ozon, Wildberries и др., чтобы добавлять товары для автоматического сравнения.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700">История сканирований и сравнений</h3>
            </div>
            <ul role="list" className="divide-y divide-gray-100">
              {scans.map((s) => {
                const dateString = new Date(s.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <li key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-x-6 gap-y-4 px-6 py-5 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-x-3">
                        <p className="text-sm font-semibold leading-6 text-gray-900 truncate max-w-[280px] sm:max-w-md">
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
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-400">
                        <span className="font-semibold text-gray-500 uppercase">{s.shop}</span>
                        <span className="text-gray-300">•</span>
                        <span>{dateString}</span>
                        <span className="text-gray-300">•</span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-500 hover:underline truncate max-w-[180px]"
                        >
                          Перейти к источнику
                        </a>
                      </div>
                      {s.error && (
                        <p className="mt-2 text-xs font-semibold text-red-500">
                          Ошибка: {s.error}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-none items-center gap-x-4">
                      {s.status === 'completed' && s.productId && (
                        <Link
                          href={`/product/${s.productId}`}
                          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-600 border border-blue-200 shadow-sm hover:bg-blue-50 transition-all active:scale-[0.98]"
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
