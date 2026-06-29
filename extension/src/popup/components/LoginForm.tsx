import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { setAuth, error, setError } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = isRegister ? 'register' : 'login';
    try {
      const response = await fetch(`http://localhost:3001/auth/${endpoint}`, {
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
      if (data.accessToken) {
        setAuth(data.accessToken, email);
      } else {
        throw new Error('Токен авторизации отсутствует в ответе сервера');
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось связаться с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
        {isRegister ? 'Регистрация' : 'Вход в WorldShop'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded-md border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md text-sm transition-colors mt-2 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          className="text-xs text-blue-500 hover:underline"
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
};
