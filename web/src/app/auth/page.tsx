'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { Header } from '../../components/layout/Header';

function AuthComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = mode === 'register' ? 'register' : 'login';
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ошибка аутентификации');
      }

      const data = await response.json();
      if (data.accessToken && data.refreshToken) {
        dispatch(setCredentials({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          email,
        }));
        router.push('/');
      } else {
        throw new Error('Некорректный ответ от сервера');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Не удалось связаться с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-2">
            {mode === 'register' ? 'Создать аккаунт' : 'С возвращением!'}
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            {mode === 'register'
              ? 'Зарегистрируйтесь для сохранения истории поисков'
              : 'Войдите в личный кабинет WorldShop'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3.5 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Секунду...' : mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          {/* Social OAuth Dividers */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2.5 text-gray-500 font-medium">Или войти через</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Google
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/yandex`}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm active:scale-[0.98]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-red-600 font-extrabold text-[13px] text-white select-none">Я</span>
              Яндекс
            </a>
          </div>

          <div className="mt-8 text-center">
            <Link
              href={mode === 'register' ? '/auth?mode=login' : '/auth?mode=register'}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {mode === 'register' ? 'Уже зарегистрированы? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <AuthComponent />
    </Suspense>
  );
}
