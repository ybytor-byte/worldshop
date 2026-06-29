// ==========================================================================
// WowS WoW World Shop Mobile — Interaction Controller
// ==========================================================================

// Mock database matching targets
const PRODUCTS_MOBI = {
    'sony-headphones': {
        title: 'Sony WH-1000XM5 Wireless',
        category: 'Аудио / Наушники',
        price: '$350',
        region: 'ASIA (CN)',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80',
        searchQuery: 'Sony'
    },
    'chanel-bag': {
        title: 'Chanel Classic Double Flap',
        category: 'Люкс / Аксессуары',
        price: '$9,700',
        region: 'EU (FR)',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=150&q=80',
        searchQuery: 'Chanel'
    },
    'dyson-airwrap': {
        title: 'Dyson Airwrap Complete Long',
        category: 'Красота / Стайлеры',
        price: '$560',
        region: 'ASIA (CN)',
        image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=150&q=80',
        searchQuery: 'Dyson'
    },
    'iphone-15': {
        title: 'Apple iPhone 15 Pro Max',
        category: 'Смартфоны / Apple',
        price: '$1,150',
        region: 'ASIA (CN)',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=150&q=80',
        searchQuery: 'iPhone'
    }
};

let currentSelectedProduct = null;

// DOM Elements
const flashEffect = document.getElementById('flash-effect');
const viewfinderBg = document.querySelector('.viewfinder-bg');
const detectTargets = document.querySelectorAll('.detect-target');
const productSheet = document.getElementById('product-sheet');
const dragHandle = document.querySelector('.sheet-drag-handle');

// Sheet details elements
const sheetProdImg = document.getElementById('sheet-prod-img');
const sheetProdTitle = document.getElementById('sheet-prod-title');
const sheetProdCategory = document.getElementById('sheet-prod-category');
const sheetPriceVal = document.getElementById('sheet-price-val');
const sheetCountryBadge = document.getElementById('sheet-country-badge');
const sheetDescInput = document.getElementById('sheet-desc-input');

// Buttons
const btnShutter = document.getElementById('btn-shutter');
const btnGlobeSwitch = document.getElementById('btn-globe-switch');
const btnGoToGlobe = document.getElementById('btn-go-to-globe');
const btnSaveFav = document.getElementById('btn-save-fav');
const btnGallerySimulate = document.getElementById('btn-gallery-simulate');

// Text search
const mobSearchInput = document.getElementById('mob-search-input');
const mobBtnTextSearch = document.getElementById('mob-btn-text-search');

// --- INTERACTIVE DETECTIONS ---

detectTargets.forEach(target => {
    target.addEventListener('click', () => {
        const prodId = target.getAttribute('data-product');
        const prodData = PRODUCTS_MOBI[prodId];
        
        if (prodData) {
            // Activate target styling
            detectTargets.forEach(t => t.classList.remove('active'));
            target.classList.add('active');
            
            triggerScanCapture(prodData);
        }
    });
});

// Trigger Shutter Flash & open bottom sheet
function triggerScanCapture(prodData) {
    // 1. Play Shutter Flash
    flashEffect.classList.add('flash-play');
    
    // 2. Play shutter sound if supported, or visual effect
    viewfinderBg.classList.add('scan-active');
    
    setTimeout(() => {
        flashEffect.classList.remove('flash-play');
    }, 300);
    
    // 3. Populate and slide up bottom sheet
    setTimeout(() => {
        currentSelectedProduct = prodData;
        
        sheetProdImg.src = prodData.image;
        sheetProdTitle.textContent = prodData.title;
        sheetProdCategory.textContent = prodData.category;
        sheetPriceVal.textContent = prodData.price;
        sheetCountryBadge.textContent = prodData.region;
        sheetDescInput.value = ''; // clear previous notes
        
        // Reset bookmark icon
        btnSaveFav.innerHTML = '<i class="fa-regular fa-bookmark"></i> Сохранить';
        btnSaveFav.style.color = '';
        
        productSheet.classList.add('open');
    }, 400);
}

// Drag handle to close bottom sheet
dragHandle.addEventListener('click', () => {
    closeBottomSheet();
});

// Close sheet on swiping down-ish (or clicking viewfinder)
viewfinderBg.addEventListener('click', () => {
    closeBottomSheet();
});

function closeBottomSheet() {
    productSheet.classList.remove('open');
    viewfinderBg.classList.remove('scan-active');
    detectTargets.forEach(t => t.classList.remove('active'));
    currentSelectedProduct = null;
}

// --- CONTROLS ACTIONS ---

// General shutter button makes a snapshot of whatever is highlighted, or random
btnShutter.addEventListener('click', () => {
    // If a target is already selected or we just auto-select the headphones
    const activeTarget = document.querySelector('.detect-target.active');
    if (activeTarget) {
        const prodId = activeTarget.getAttribute('data-product');
        triggerScanCapture(PRODUCTS_MOBI[prodId]);
    } else {
        // Shutter flash and auto detect the Sony headphones
        const headphonesTarget = document.querySelector('.target-headphones');
        headphonesTarget.classList.add('active');
        triggerScanCapture(PRODUCTS_MOBI['sony-headphones']);
    }
});

// Switch to gallery simulation
btnGallerySimulate.addEventListener('click', () => {
    alert('Симуляция: Загрузка фото из галереи телефона. Сканирование...');
    // Trigger Dyson airwrap detection
    triggerScanCapture(PRODUCTS_MOBI['dyson-airwrap']);
});

// Bookmark / Save feature
btnSaveFav.addEventListener('click', () => {
    if (btnSaveFav.innerHTML.includes('fa-regular')) {
        btnSaveFav.innerHTML = '<i class="fa-solid fa-bookmark"></i> Сохранено';
        btnSaveFav.style.color = 'var(--mob-green)';
        
        // Toast message simulator
        showNotification('Товар сохранен в избранное!');
    } else {
        btnSaveFav.innerHTML = '<i class="fa-regular fa-bookmark"></i> Сохранить';
        btnSaveFav.style.color = '';
    }
});

// Navigation switches
btnGlobeSwitch.addEventListener('click', () => {
    window.open('../web/index.html', '_blank');
});

btnGoToGlobe.addEventListener('click', () => {
    if (currentSelectedProduct) {
        const descSuffix = sheetDescInput.value.trim() ? `&note=${encodeURIComponent(sheetDescInput.value)}` : '';
        window.open(`../web/index.html?search=${currentSelectedProduct.searchQuery}${descSuffix}`, '_blank');
    }
});

// --- TEXT SEARCH IN MOBILE ---

mobBtnTextSearch.addEventListener('click', () => {
    performMobileSearch();
});

mobSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performMobileSearch();
    }
});

function performMobileSearch() {
    const val = mobSearchInput.value.trim().toLowerCase();
    if (!val) return;
    
    closeBottomSheet();
    
    // Check match
    let matchedKey = null;
    if (val.includes('sony') || val.includes('наушник') || val.includes('xm5')) {
        matchedKey = 'sony-headphones';
    } else if (val.includes('chanel') || val.includes('сумк') || val.includes('шанель')) {
        matchedKey = 'chanel-bag';
    } else if (val.includes('dyson') || val.includes('стайлер') || val.includes('airwrap') || val.includes('фен')) {
        matchedKey = 'dyson-airwrap';
    } else if (val.includes('iphone') || val.includes('айфон') || val.includes('apple')) {
        matchedKey = 'iphone-15';
    }
    
    if (matchedKey) {
        // Highlight in UI if visible in viewfinder
        const matchingTarget = document.querySelector(`.detect-target[data-product="${matchedKey}"]`);
        if (matchingTarget) {
            matchingTarget.classList.add('active');
        }
        triggerScanCapture(PRODUCTS_MOBI[matchedKey]);
    } else {
        showNotification('Товар не найден в демо-базе');
    }
    
    mobSearchInput.value = '';
}

// Simple Toast Notification
function showNotification(text) {
    const toast = document.createElement('div');
    toast.textContent = text;
    Object.assign(toast.style, {
        position: 'absolute',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(16, 185, 129, 0.9)',
        color: '#fff',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '11.5px',
        fontWeight: 'bold',
        zIndex: '150',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease'
    });
    
    document.querySelector('.phone-screen').appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
