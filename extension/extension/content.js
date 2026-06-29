// ==========================================================================
// WowS - World Shop — Content Script for Visual Search
// ==========================================================================

let activeImage = null;
let hoverBtn = null;
let resultsPanel = null;
let isExtensionEnabled = true;

// Mock database to match images on external pages
const EXT_MOCK_MATCHES = [
    {
        keywords: ['headphone', 'headset', 'audio', 'sony', 'наушник'],
        title: 'Sony WH-1000XM5 Wireless Headphones',
        priceFrom: '$350',
        webUrl: 'web/index.html?search=Sony'
    },
    {
        keywords: ['bag', 'chanel', 'handbag', 'purse', 'сумка', 'шанель'],
        title: 'Chanel Classic Double Flap Bag',
        priceFrom: '$9,700',
        webUrl: 'web/index.html?search=Chanel'
    },
    {
        keywords: ['dyson', 'airwrap', 'hair', 'стайлер', 'дайсон'],
        title: 'Dyson Airwrap Styler Complete',
        priceFrom: '$560',
        webUrl: 'web/index.html?search=Dyson'
    },
    {
        keywords: ['iphone', 'apple', 'phone', 'айфон'],
        title: 'Apple iPhone 15 Pro Max',
        priceFrom: '$1,150',
        webUrl: 'web/index.html?search=iPhone'
    }
];

// Initialize Extension Settings
chrome.storage.local.get(['enabled'], (result) => {
    if (result.enabled !== undefined) {
        isExtensionEnabled = result.enabled;
    }
});

// Listen for updates from popup
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'toggleExtension') {
        isExtensionEnabled = message.enabled;
        if (!isExtensionEnabled) {
            removeHoverButton();
            removeResultsPanel();
        }
    }
});

// Listen to hover events globally
document.addEventListener('mouseover', (e) => {
    if (!isExtensionEnabled) return;
    
    const target = e.target;
    if (target.tagName === 'IMG' && target.width > 120 && target.height > 120) {
        activeImage = target;
        showHoverButton(target);
    }
});

// Remove button if mouse moves away from image and button
document.addEventListener('mousemove', (e) => {
    if (!hoverBtn || !activeImage) return;
    
    const rectImg = activeImage.getBoundingClientRect();
    const rectBtn = hoverBtn.getBoundingClientRect();
    const buffer = 15;
    
    const isOverImg = (
        e.clientX >= rectImg.left - buffer &&
        e.clientX <= rectImg.right + buffer &&
        e.clientY >= rectImg.top - buffer &&
        e.clientY <= rectImg.bottom + buffer
    );
    
    const isOverBtn = (
        e.clientX >= rectBtn.left &&
        e.clientX <= rectBtn.right &&
        e.clientY >= rectBtn.top &&
        e.clientY <= rectBtn.bottom
    );
    
    if (!isOverImg && !isOverBtn) {
        removeHoverButton();
    }
});

// Create and position hover button
function showHoverButton(img) {
    if (hoverBtn) {
        removeHoverButton();
    }
    
    const rect = img.getBoundingClientRect();
    
    hoverBtn = document.createElement('button');
    hoverBtn.id = 'gs-hover-btn';
    hoverBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="gs-svg-spin">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M2 12h20"></path>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>WowS Search</span>
    `;
    
    // Inline styling for extension sandbox safety
    Object.assign(hoverBtn.style, {
        position: 'fixed',
        top: `${rect.top + window.scrollY + 12}px`,
        left: `${rect.left + window.scrollX + 12}px`,
        zIndex: '999999',
        background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '20px',
        padding: '8px 14px',
        fontSize: '12px',
        fontWeight: '700',
        fontFamily: "'Outfit', -apple-system, sans-serif",
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        pointerEvents: 'auto'
    });
    
    injectStyles();
    
    hoverBtn.addEventListener('mouseenter', () => {
        hoverBtn.style.transform = 'scale(1.05)';
        hoverBtn.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.6)';
    });
    
    hoverBtn.addEventListener('mouseleave', () => {
        hoverBtn.style.transform = 'scale(1)';
        hoverBtn.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
    });
    
    hoverBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        triggerVisualSearch(img);
    });
    
    document.body.appendChild(hoverBtn);
}

function removeHoverButton() {
    if (hoverBtn && hoverBtn.parentNode) {
        hoverBtn.parentNode.removeChild(hoverBtn);
    }
    hoverBtn = null;
}

// Visual Search Action
function triggerVisualSearch(img) {
    removeHoverButton();
    removeResultsPanel();
    
    const imgInfo = (img.src + ' ' + img.alt + ' ' + img.className).toLowerCase();
    let match = EXT_MOCK_MATCHES.find(item => 
        item.keywords.some(keyword => imgInfo.includes(keyword))
    );
    
    if (!match) {
        match = EXT_MOCK_MATCHES[0];
    }
    
    showResultsPanel(match, img.src);
}

function showResultsPanel(productMatch, imgSrc) {
    resultsPanel = document.createElement('div');
    resultsPanel.id = 'gs-sidebar-panel';
    
    resultsPanel.innerHTML = `
        <div class="gs-panel-header">
            <div class="gs-panel-logo">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="#06b6d4" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="gs-logo-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M2 12h20"></path>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span>WowS WORLD SHOP</span>
            </div>
            <button id="gs-panel-close">&times;</button>
        </div>
        
        <div class="gs-panel-body">
            <div class="gs-analyzing-indicator">
                <div class="gs-radar-ring"></div>
                <img src="${imgSrc}" class="gs-source-img" />
            </div>
            
            <div class="gs-match-title">Товар успешно распознан</div>
            <h3 class="gs-product-name">${productMatch.title}</h3>
            
            <div class="gs-divider"></div>
            
            <div class="gs-offer-price-row">
                <span class="gs-price-label">Минимальная цена:</span>
                <span class="gs-price-val">от ${productMatch.priceFrom}</span>
            </div>
            
            <p class="gs-disclaimer">Цены найдены в 4 регионах с автоматическим расчетом таможни и доставки.</p>
            
            <a href="http://127.0.0.1:8080/${productMatch.webUrl}" target="_blank" id="gs-btn-go">
                Открыть 3D Глобус поиска &rarr;
            </a>
        </div>
    `;
    
    Object.assign(resultsPanel.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '320px',
        bottom: '20px',
        zIndex: '1000000',
        background: 'rgba(15, 15, 27, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(139, 92, 246, 0.15)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        animation: 'gsSlideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
    });
    
    document.body.appendChild(resultsPanel);
    
    document.getElementById('gs-panel-close').addEventListener('click', () => {
        removeResultsPanel();
    });
}

function removeResultsPanel() {
    if (resultsPanel && resultsPanel.parentNode) {
        resultsPanel.parentNode.removeChild(resultsPanel);
    }
    resultsPanel = null;
}

// Inject CSS Styles for keyframes, logo spin, and panel elements
function injectStyles() {
    if (document.getElementById('gs-global-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'gs-global-styles';
    styleEl.textContent = `
        @keyframes gsSlideIn {
            from { transform: translateX(50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .gs-svg-spin {
            animation: gsSpin 4s linear infinite;
        }
        @keyframes gsSpin {
            100% { transform: rotate(360deg); }
        }
        
        #gs-sidebar-panel * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        .gs-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        
        .gs-panel-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #ffffff;
        }
        
        .gs-logo-icon {
            animation: gsSpin 12s linear infinite;
        }
        
        #gs-panel-close {
            background: none;
            border: none;
            color: #888;
            font-size: 22px;
            cursor: pointer;
            line-height: 1;
        }
        #gs-panel-close:hover {
            color: #fff;
        }
        
        .gs-panel-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            flex: 1;
        }
        
        .gs-analyzing-indicator {
            position: relative;
            width: 110px;
            height: 110px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .gs-source-img {
            width: 90px;
            height: 90px;
            border-radius: 12px;
            object-fit: cover;
            border: 2px solid #8b5cf6;
            z-index: 10;
        }
        
        .gs-radar-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid #06b6d4;
            animation: gsRadarPulse 1.6s ease-out infinite;
        }
        
        @keyframes gsRadarPulse {
            0% { transform: scale(0.85); opacity: 0.8; }
            100% { transform: scale(1.15); opacity: 0; }
        }
        
        .gs-match-title {
            font-size: 11px;
            color: #06b6d4;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
        }
        
        .gs-product-name {
            font-size: 15px;
            font-weight: 700;
            text-align: center;
            color: #f4f4f6;
            line-height: 1.4;
        }
        
        .gs-divider {
            width: 100%;
            height: 1px;
            background: rgba(255,255,255,0.06);
        }
        
        .gs-offer-price-row {
            display: flex;
            justify-content: space-between;
            width: 100%;
            align-items: center;
        }
        
        .gs-price-label {
            font-size: 13px;
            color: #a1a1aa;
        }
        
        .gs-price-val {
            font-size: 18px;
            font-weight: 800;
            color: #10b981;
        }
        
        .gs-disclaimer {
            font-size: 10.5px;
            color: #71717a;
            text-align: center;
            line-height: 1.4;
        }
        
        #gs-btn-go {
            width: 100%;
            background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            font-size: 13px;
            font-weight: 700;
            margin-top: auto;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        #gs-btn-go:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(6, 182, 212, 0.5);
        }
    `;
    document.head.appendChild(styleEl);
}
