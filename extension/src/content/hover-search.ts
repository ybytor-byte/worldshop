const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let btn: HTMLDivElement | null = null;
let panel: HTMLDivElement | null = null;
let currentImg: HTMLImageElement | null = null;

function getKeywords(img: HTMLImageElement): string {
  const parts = [
    img.alt,
    img.title,
    img.src.split('/').pop()?.split(/[._-]/).join(' '),
    img.closest('a')?.textContent,
    img.closest('figure, div, li, article')?.textContent?.slice(0, 200),
  ];
  return [...new Set(parts.filter(Boolean).map((s) => s!.trim().slice(0, 100)))].join(' ').slice(0, 300);
}

function createButton(img: HTMLImageElement) {
  removeButton();
  btn = document.createElement('div');
  btn.id = 'worldshop-hover-btn';
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
    <span>В WorldShop</span>
  `;
  Object.assign(btn.style, {
    position: 'fixed', zIndex: '999999', display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
    color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px',
    fontWeight: '600', fontFamily: '-apple-system, sans-serif', cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(139,92,246,0.4)', transition: 'all 0.2s', pointerEvents: 'auto',
  });
  document.body.appendChild(btn);
  positionButton(img);
  btn.onmouseenter = () => { if (btn) btn.style.transform = 'scale(1.05)'; };
  btn.onmouseleave = () => { if (btn) btn.style.transform = 'scale(1)'; };
  btn.onclick = (e) => { e.stopPropagation(); searchProduct(img); };
}

function positionButton(img: HTMLImageElement) {
  if (!btn) return;
  const rect = img.getBoundingClientRect();
  btn.style.left = `${rect.left + 12}px`;
  btn.style.top = `${rect.top + 12}px`;
}

function removeButton() { if (btn) { btn.remove(); btn = null; } }
function removePanel() { if (panel) { panel.remove(); panel = null; } }

async function searchProduct(img: HTMLImageElement) {
  removePanel(); removeButton();
  const keywords = getKeywords(img);

  panel = document.createElement('div');
  panel.id = 'worldshop-hover-panel';
  Object.assign(panel.style, {
    position: 'fixed', top: '20px', right: '20px', width: '320px', maxHeight: '90vh',
    zIndex: '999999', background: '#ffffff', borderRadius: '16px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.2)', fontFamily: '-apple-system, sans-serif',
    overflow: 'hidden', animation: 'worldshopSlideIn 0.3s ease-out',
  });
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid #f3f4f6">
      <span style="font-weight:700;font-size:15px;color:#111827">WorldShop</span>
      <button id="ws-close-panel" style="background:none;border:none;font-size:18px;cursor:pointer;color:#9ca3af;padding:0 4px">&times;</button>
    </div>
    <div id="ws-panel-content" style="padding:16px">
      <div style="text-align:center;padding:20px">
        <div style="width:24px;height:24px;border:3px solid #e5e7eb;border-top-color:#8b5cf6;border-radius:50%;margin:0 auto 12px;animation:wsSpin 0.8s linear infinite"></div>
        <div style="font-size:13px;color:#6b7280">Ищем товар...</div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  document.getElementById('ws-close-panel')?.addEventListener('click', removePanel);

  try {
    const queryUrl = keywords ? `?search=${encodeURIComponent(keywords)}` : '';
    const res = await fetch(`${BASE_URL}/products${queryUrl}`);
    const products = await res.json();
    showProducts(products, keywords);
  } catch {
    showError('Ошибка соединения');
  }
}

function showProducts(products: any[], query: string) {
  const content = document.getElementById('ws-panel-content');
  if (!content) return;

  if (query) {
    content.innerHTML = `<div style="font-size:12px;color:#6b7280;margin-bottom:12px">По запросу: <strong>${query.slice(0, 80)}</strong></div>`;
  } else {
    content.innerHTML = `<div style="font-size:12px;color:#6b7280;margin-bottom:12px">Поиск товаров</div>`;
  }

  if (products.length > 0) {
    products.slice(0, 5).forEach((p) => {
      const minPrice = Math.min(...(p.offers || []).map((o: any) => o.price));
      content.innerHTML += `
        <a href="${BASE_URL.replace(':3001', ':3000')}/product/${p.id}" target="_blank" rel="noopener"
          style="display:block;padding:10px 12px;background:#f9fafb;border-radius:10px;text-decoration:none;margin-bottom:6px;transition:background 0.15s;cursor:pointer"
          onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='#f9fafb'">
          <div style="font-size:13px;font-weight:600;color:#111827">${p.brand} ${p.model}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px">от ${minPrice.toLocaleString()} ₽</div>
        </a>`;
    });
  } else {
    content.innerHTML += `<div style="text-align:center;padding:16px;color:#9ca3af;font-size:13px">Товары не найдены</div>`;
  }

  if (query) {
    content.innerHTML += `
      <a href="http://localhost:3000/?search=${encodeURIComponent(query)}" target="_blank"
        style="display:block;text-align:center;margin-top:12px;padding:10px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:white;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none">
        Открыть в WorldShop
      </a>`;
  }
}

function showError(msg: string) {
  const content = document.getElementById('ws-panel-content');
  if (!content) return;
  content.innerHTML = `<div style="text-align:center;color:#ef4444;padding:16px;font-size:13px">${msg}</div>`;
}

function injectStyles() {
  if (document.getElementById('ws-hover-styles')) return;
  const style = document.createElement('style');
  style.id = 'ws-hover-styles';
  style.textContent = `
    @keyframes wsSpin { to { transform: rotate(360deg) } }
    @keyframes worldshopSlideIn { from { opacity: 0; transform: translateX(50px) } to { opacity: 1; transform: translateX(0) } }
  `;
  document.head.appendChild(style);
}

injectStyles();
document.addEventListener('mouseover', (e) => {
  const t = e.target as HTMLElement;
  if (t.tagName === 'IMG' && (t as HTMLImageElement).width > 100 && (t as HTMLImageElement).height > 100) {
    if (currentImg !== t) { currentImg = t as HTMLImageElement; createButton(currentImg); }
  }
});
document.addEventListener('mousemove', (e) => {
  if (!btn || !currentImg) return;
  const rect = currentImg.getBoundingClientRect();
  const m = 20;
  if (e.clientX < rect.left - m || e.clientX > rect.right + m || e.clientY < rect.top - m || e.clientY > rect.bottom + m) {
    const br = btn.getBoundingClientRect();
    if (e.clientX < br.left - m || e.clientX > br.right + m || e.clientY < br.top - m || e.clientY > br.bottom + m) {
      removeButton(); currentImg = null;
    }
  }
});
