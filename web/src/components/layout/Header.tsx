'use client';

import React from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearCredentials } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';

export const Header: React.FC = () => {
  const { isAuthenticated, email } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    dispatch(clearCredentials());
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b transition-colors" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight transition-transform hover:scale-[1.02]" style={{ color: 'var(--accent-primary)' }}>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: 'var(--accent-primary)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span>World<span className="font-extrabold" style={{ color: 'var(--text-primary)' }}>Shop</span></span>
          </Link>
        </div>

        {/* Theme toggle + Auth */}
        <nav className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-[0.92]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm font-semibold transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Личный кабинет
              </Link>
              <span className="hidden text-xs sm:inline" style={{ color: 'var(--text-muted)' }}>|</span>
              <span className="hidden text-sm max-w-[120px] truncate sm:inline" style={{ color: 'var(--text-muted)' }} title={email || ''}>
                {email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3.5 py-2 text-xs font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth?mode=login"
                className="rounded-lg px-3.5 py-2 text-sm font-semibold transition-all"
                style={{ color: 'var(--text-secondary)' }}
              >
                Войти
              </Link>
              <Link
                href="/auth?mode=register"
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--gradient-primary)' }}
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
