'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '../../../store/hooks';
import { setCredentials } from '../../../store/slices/authSlice';

function AuthCallbackComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState('Аутентификация через OAuth...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const authError = searchParams.get('error');

    if (authError) {
      setError(`Ошибка входа через социальную сеть: ${authError}`);
      setStatus('');
      return;
    }

    if (accessToken && refreshToken) {
      try {
        // Decode JWT to extract email
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        const email = payload.email || 'oauth-user@worldshop.ru';

        dispatch(setCredentials({ accessToken, refreshToken, email }));
        setStatus('Успешный вход! Перенаправление...');
        
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch {
        setError('Не удалось разобрать токен от сервера');
        setStatus('');
      }
    } else {
      setError('Не предоставлены ключи доступа (tokens)');
      setStatus('');
    }
  }, [searchParams, dispatch, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md border border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Авторизация</h2>
        
        {status && (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm font-medium text-gray-600">{status}</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-50 p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              onClick={() => router.push('/auth')}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Вернуться на страницу входа
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <AuthCallbackComponent />
    </Suspense>
  );
}

