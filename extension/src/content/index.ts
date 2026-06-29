import { getExtractorForDomain } from './extractors/registry';
import { cleanDom } from './dom-cleaner';
import { RawProductPayload } from './extractors/types';

// Run extraction on load
function init() {
  const hostname = window.location.hostname;
  const extractor = getExtractorForDomain(hostname);
  
  // Extract data from document
  const payload = extractor.extract(document);
  if (!payload) {
    console.log('[WorldShop] Not a product page or could not parse title.');
    return;
  }

  // Use DOM cleaner as a fallback/supplement for specs if it's empty
  if (!payload.specsText) {
    payload.specsText = cleanDom(document.body).substring(0, 10000); // Limit text length
  }

  console.log('[WorldShop] Extracted product payload:', payload);

  // Send raw payload to the background service worker
  chrome.runtime.sendMessage({ type: 'INGEST_PRODUCT', payload }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[WorldShop] Send message failed:', chrome.runtime.lastError.message);
      showOverlay({ status: 'error', message: 'Ошибка связи с расширением' });
      return;
    }

    if (response && response.status === 'enqueued') {
      showOverlay({ status: 'analyzing', message: 'Анализируем товар через ИИ...' });
    } else {
      showOverlay({ status: 'error', message: response?.message || 'Не удалось отправить на анализ' });
    }
  });
}

// Listen for updates from background service worker (e.g. via WebSockets)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PRODUCT_ANALYSIS_COMPLETE') {
    const { product } = message;
    if (product) {
      // Find the best price compared to the current one
      const currentShop = getExtractorForDomain(window.location.hostname).shop;
      const currentOffer = product.offers.find((o: any) => o.shop === currentShop);
      const currentPrice = currentOffer ? currentOffer.price : null;

      // Find the cheapest offer
      let cheapestOffer = product.offers[0];
      for (const offer of product.offers) {
        if (offer.price < cheapestOffer.price) {
          cheapestOffer = offer;
        }
      }

      if (currentPrice && cheapestOffer.price < currentPrice) {
        const diffPercent = Math.round(((currentPrice - cheapestOffer.price) / currentPrice) * 100);
        showOverlay({
          status: 'cheaper_found',
          message: `Найдено дешевле на ${diffPercent}% в ${cheapestOffer.shop}!`,
          product,
          cheapestOffer,
        });
      } else {
        showOverlay({
          status: 'success',
          message: `Товар проверен. Всего предложений: ${product.offers.length}`,
          product,
        });
      }
    }
  } else if (message.type === 'PRODUCT_ANALYSIS_FAILED') {
    showOverlay({ status: 'error', message: message.error || 'Ошибка ИИ-анализа' });
  }
});

let overlayEl: HTMLDivElement | null = null;

interface OverlayState {
  status: 'analyzing' | 'success' | 'cheaper_found' | 'error';
  message: string;
  product?: any;
  cheapestOffer?: any;
}

function showOverlay(state: OverlayState) {
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    overlayEl.id = 'worldshop-overlay-widget';
    document.body.appendChild(overlayEl);
  }

  // Inline CSS styles helper to guarantee styles are applied properly
  let statusColor = '#3b82f6'; // blue
  if (state.status === 'success') statusColor = '#10b981'; // green
  if (state.status === 'cheaper_found') statusColor = '#f59e0b'; // orange/yellow
  if (state.status === 'error') statusColor = '#ef4444'; // red

  const offersHtml = state.product?.offers
    ? `
      <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px; max-height: 120px; overflow-y: auto;">
        ${state.product.offers
          .map(
            (o: any) => `
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span>${o.shop}</span>
            <span style="font-weight: bold;">${o.price.toLocaleString()} ₽</span>
          </div>
        `
          )
          .join('')}
      </div>
    `
    : '';

  const cheapestOfferHtml = state.cheapestOffer
    ? `
      <div style="margin-top: 8px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; padding: 6px; font-size: 11px;">
        Лучшая цена: <a href="http://localhost:3001${state.cheapestOffer.affiliateUrl || '/go/redirect?url=' + encodeURIComponent(state.cheapestOffer.url)}" target="_blank" style="color: #d97706; font-weight: bold; text-decoration: underline;">
          ${state.cheapestOffer.price.toLocaleString()} ₽ в ${state.cheapestOffer.shop}
        </a>
      </div>
    `
    : '';

  overlayEl.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-left: 5px solid ${statusColor};
      border-radius: 6px;
      padding: 12px;
      width: 260px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #374151;
      font-size: 13px;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; font-weight: bold; margin-bottom: 6px;">
        <span style="color: #111827;">WorldShop</span>
        <button id="worldshop-overlay-close" style="background: none; border: none; font-size: 14px; cursor: pointer; color: #9ca3af; padding: 0 4px;">&times;</button>
      </div>
      <div>${state.message}</div>
      ${cheapestOfferHtml}
      ${offersHtml}
    </div>
  `;

  // Bind close action
  overlayEl.querySelector('#worldshop-overlay-close')?.addEventListener('click', () => {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
  });
}

// Delay execution slightly to allow dynamic page contents to load
setTimeout(init, 2000);
