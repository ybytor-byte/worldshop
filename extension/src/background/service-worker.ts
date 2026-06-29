// Background Service Worker for WorldShop Extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INGEST_PRODUCT') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ status: 'error', message: 'No tab context found' });
      return true;
    }

    // 1. Fetch JWT from storage
    chrome.storage.local.get(['accessToken'], (result) => {
      const token = result.accessToken;
      if (!token) {
        // Set extension badge to alert user they need to log in
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        sendResponse({ status: 'error', message: 'Необходима авторизация. Пожалуйста, войдите в аккаунт через всплывающее окно.' });
        return;
      }

      // Clear badge
      chrome.action.setBadgeText({ text: '' });

      // 2. Post to backend
      fetch('http://localhost:3001/products/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(message.payload),
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              chrome.action.setBadgeText({ text: '!' });
              chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
              throw new Error('Сессия истекла. Пожалуйста, переавторизуйтесь.');
            }
            throw new Error(`Ошибка сервера: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          // Success, start polling for status
          sendResponse({ status: 'enqueued', data });
          if (data.rawIngestId) {
            pollIngestStatus(data.rawIngestId, token, tabId);
          }
        })
        .catch((err) => {
          console.error('[WorldShop SW] Ingest failed:', err);
          sendResponse({ status: 'error', message: err.message });
        });
    });

    return true; // Keeps the sendResponse channel open asynchronously
  }
});

// Poll the status of the raw ingest job
function pollIngestStatus(ingestId: string, token: string, tabId: number) {
  const maxAttempts = 30; // 60 seconds total at 2s interval
  let attempts = 0;

  const intervalId = setInterval(() => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(intervalId);
      chrome.tabs.sendMessage(tabId, {
        type: 'PRODUCT_ANALYSIS_FAILED',
        error: 'Превышено время ожидания анализа товара',
      }).catch(() => {});
      return;
    }

    fetch(`http://localhost:3001/products/ingest/status/${ingestId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch status');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'completed') {
          clearInterval(intervalId);
          chrome.tabs.sendMessage(tabId, {
            type: 'PRODUCT_ANALYSIS_COMPLETE',
            product: data.product,
          }).catch(() => {});
        } else if (data.status === 'failed') {
          clearInterval(intervalId);
          chrome.tabs.sendMessage(tabId, {
            type: 'PRODUCT_ANALYSIS_FAILED',
            error: data.error || 'Ошибка ИИ-классификации товара',
          }).catch(() => {});
        }
      })
      .catch((err) => {
        console.error('[WorldShop SW] Polling error:', err);
      });
  }, 2000);
}
