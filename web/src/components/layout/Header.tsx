'use client';

import React from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearCredentials } from '../../store/slices/authSlice';

export const Header: React.FC = () => {
  const { isAuthenticated, email } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(clearCredentials());
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 transition-transform hover:scale-[1.02]">
            <svg
              className="h-6 w-6 text-blue-600 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span>World<span className="text-gray-900 font-extrabold">Shop</span></span>
          </Link>
        </div>

        {/* Auth / Action button */}
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
              >
                Личный кабинет
              </Link>
              <span className="hidden text-xs text-gray-400 sm:inline">|</span>
              <span className="hidden text-sm text-gray-500 max-w-[120px] truncate sm:inline" title={email || ''}>
                {email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth?mode=login"
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all"
              >
                Войти
              </Link>
              <Link
                href="/auth?mode=register"
                className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow transition-all active:scale-[0.98]"
              >
                Регистрация
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
