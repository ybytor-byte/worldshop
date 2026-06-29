import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { LoginForm } from './components/LoginForm';
import { StatusPanel } from './components/StatusPanel';
import './styles/popup.css';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="w-[300px] h-[360px] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-medium">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] min-h-[360px] p-4 bg-white flex flex-col justify-between select-none">
      <main className="flex-1 flex flex-col items-center justify-center">
        {isAuthenticated ? <StatusPanel /> : <LoginForm />}
      </main>
      <footer className="border-t pt-2 mt-4 flex justify-between text-[10px] text-gray-400">
        <span>WorldShop © 2026</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  );
};
