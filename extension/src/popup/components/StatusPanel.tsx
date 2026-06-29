import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export const StatusPanel: React.FC = () => {
  const { userEmail, logout } = useStore();
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Get info of current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.url) {
        setCurrentTab(activeTab);
        const url = new URL(activeTab.url);
        const supportedDomains = [
          'ozon.ru',
          'wildberries.ru',
          'dns-shop.ru',
          'mvideo.ru',
          'market.yandex.ru',
        ];
        const match = supportedDomains.some((domain) => url.hostname.includes(domain));
        setIsSupported(match);
      }
    });
  }, []);

  return (
    <div className="w-full text-gray-700 flex flex-col gap-4">
      {/* Header Info */}
      <div className="flex justify-between items-center border-b pb-2">
        <span className="text-xs text-gray-500 truncate max-w-[160px]">{userEmail}</span>
        <button
          onClick={logout}
          className="text-xs text-red-500 hover:text-red-600 font-semibold"
        >
          Выйти
        </button>
      </div>

      {/* Main Status */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-2">
        <h3 className="font-semibold text-sm text-gray-800">Текущая вкладка:</h3>
        {currentTab ? (
          <>
            <div className="text-xs text-gray-600 truncate font-mono">{new URL(currentTab.url || '').hostname}</div>
            <div className="text-xs font-medium text-gray-500 truncate">{currentTab.title}</div>
            
            {isSupported ? (
              <div className="flex items-center gap-2 mt-2 text-green-600 font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Магазин поддерживается
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-yellow-600 font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Будет использован fallback-парсер
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-gray-400">Нет активной вкладки</div>
        )}
      </div>

      {/* Extra Links */}
      <div className="flex flex-col gap-2 text-center text-xs mt-1">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="bg-blue-50 text-blue-600 font-semibold py-2 rounded-md hover:bg-blue-100 transition-colors"
        >
          Перейти на сайт сравнения
        </a>
        <div className="text-[10px] text-gray-400">
          WorldShop автоматически анализирует карточки товаров при их открытии на поддерживаемых сайтах.
        </div>
      </div>
    </div>
  );
};
