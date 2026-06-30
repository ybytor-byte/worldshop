// ==========================================================================
// WowS WoW World Shop — Core Logic & 3D MapLibre Globe (Hero Layout)
// ==========================================================================

// --- MOCK DATABASE ---
const PRODUCTS_DB = [
    {
        id: 'iphone-15',
        title: 'Apple iPhone 15 Pro Max (256GB)',
        category: 'Электроника',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=150&q=80',
        keywords: ['iphone', 'айфон', 'apple', '15', 'pro', 'max', 'phone', 'телефон', 'смартфон'],
        offers: [
            { id: 'off-us', store: 'Amazon (USA)', region: 'US', basePriceUSD: 1199, shippingUSD: 45, deliveryDays: '10-14 дней', link: 'https://amazon.com' },
            { id: 'off-eu', store: 'MediaMarkt (Germany)', region: 'EU', basePriceUSD: 1290, shippingUSD: 35, deliveryDays: '8-12 дней', link: 'https://mediamarkt.de' },
            { id: 'off-asia', store: 'JD.com (China)', region: 'ASIA', basePriceUSD: 1150, shippingUSD: 25, deliveryDays: '12-18 дней', link: 'https://jd.com' },
            { id: 'off-ru', store: 'WowS Express (Russia)', region: 'RU', basePriceUSD: 1490, shippingUSD: 5, deliveryDays: '1-3 дня', link: '#' }
        ]
    },
    {
        id: 'dyson-airwrap',
        title: 'Стайлер Dyson Airwrap Complete Long',
        category: 'Красота и уход',
        image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=150&q=80',
        keywords: ['dyson', 'дайсон', 'стайлер', 'airwrap', 'фен', 'волосы'],
        offers: [
            { id: 'off-us', store: 'Sephora (USA)', region: 'US', basePriceUSD: 599, shippingUSD: 35, deliveryDays: '12-15 дней', link: 'https://sephora.com' },
            { id: 'off-eu', store: 'Dyson DE (Germany)', region: 'EU', basePriceUSD: 630, shippingUSD: 28, deliveryDays: '10-14 дней', link: 'https://dyson.de' },
            { id: 'off-asia', store: 'Tmall (China)', region: 'ASIA', basePriceUSD: 560, shippingUSD: 22, deliveryDays: '14-20 дней', link: 'https://tmall.com' },
            { id: 'off-ru', store: 'WowS Express (Russia)', region: 'RU', basePriceUSD: 790, shippingUSD: 4, deliveryDays: '1-2 дня', link: '#' }
        ]
    },
    {
        id: 'sony-headphones',
        title: 'Беспроводные наушники Sony WH-1000XM5',
        category: 'Аудио',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80',
        keywords: ['sony', 'сони', 'headphones', 'наушники', 'xm5', 'wh', '1000xm5'],
        offers: [
            { id: 'off-us', store: 'BestBuy (USA)', region: 'US', basePriceUSD: 398, shippingUSD: 25, deliveryDays: '9-12 дней', link: 'https://bestbuy.com' },
            { id: 'off-eu', store: 'Fnac (France)', region: 'EU', basePriceUSD: 410, shippingUSD: 20, deliveryDays: '7-10 дней', link: 'https://fnac.com' },
            { id: 'off-asia', store: 'Taobao (China)', region: 'ASIA', basePriceUSD: 350, shippingUSD: 15, deliveryDays: '11-15 дней', link: 'https://taobao.com' },
            { id: 'off-ru', store: 'WowS Express (Russia)', region: 'RU', basePriceUSD: 460, shippingUSD: 5, deliveryDays: '2-4 дня', link: '#' }
        ]
    },
    {
        id: 'chanel-bag',
        title: 'Сумка Chanel Classic Double Flap',
        category: 'Люкс и аксессуары',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=150&q=80',
        keywords: ['chanel', 'шанель', 'bag', 'сумка', 'classic', 'люкс', 'luxury'],
        offers: [
            { id: 'off-us', store: 'Saks (USA)', region: 'US', basePriceUSD: 10200, shippingUSD: 150, deliveryDays: '15-20 дней', link: 'https://saksfifthavenue.com' },
            { id: 'off-eu', store: 'Chanel Paris (France)', region: 'EU', basePriceUSD: 9700, shippingUSD: 120, deliveryDays: '12-16 дней', link: 'https://chanel.com' },
            { id: 'off-asia', store: 'Lotte (South Korea)', region: 'ASIA', basePriceUSD: 10500, shippingUSD: 100, deliveryDays: '14-18 дней', link: 'https://lotte.co.kr' },
            { id: 'off-ru', store: 'WowS Premium (Russia)', region: 'RU', basePriceUSD: 13900, shippingUSD: 10, deliveryDays: '1-3 дня', link: '#' }
        ]
    }
];

// --- COORDINATES MAP ---
const REGIONS_COORDS = {
    'US': { lat: 40.7128, lng: -74.0060, label: 'USA' },
    'EU': { lat: 50.1109, lng: 8.6821, label: 'Europe (DE)' },
    'ASIA': { lat: 22.5431, lng: 114.0579, label: 'Asia (CN)' },
    'RU': { lat: 55.7558, lng: 37.6173, label: 'Russia (MSK)' }
};

const DEST_COUNTRIES_META = {
    'RU': { lat: 55.7558, lng: 37.6173, label: 'Россия', currency: '₽', rateToUSD: 92.5, dutyThresholdUSD: 215, dutyRate: 0.15, dutyFixedFeeUSD: 5 },
    'US': { lat: 40.7128, lng: -74.0060, label: 'США', currency: '$', rateToUSD: 1.0, dutyThresholdUSD: 800, dutyRate: 0.10, dutyFixedFeeUSD: 0 },
    'DE': { lat: 50.1109, lng: 8.6821, label: 'Германия', currency: '€', rateToUSD: 0.92, dutyThresholdUSD: 160, dutyRate: 0.19, dutyFixedFeeUSD: 10 },
    'JP': { lat: 35.6762, lng: 139.6503, label: 'Япония', currency: '¥', rateToUSD: 160.0, dutyThresholdUSD: 65, dutyRate: 0.10, dutyFixedFeeUSD: 5 }
};

// --- STATE ---
let selectedProduct = null;
let selectedOffer = null;
let currentDestination = 'RU';
let autoRotateActive = true;
let map;
let activeMarkers = [];

// =======================================================================
// DOM ELEMENTS
// =======================================================================

// Hero / Scroll
const btnScrollDown = document.getElementById('btn-scroll-down');
const scrollIndicator = document.getElementById('scroll-indicator');
const btnBackToGlobe = document.getElementById('btn-back-to-globe');
const heroCta = document.getElementById('hero-cta');

// Search
const searchInput = document.getElementById('search-input');
const btnSearch = document.getElementById('btn-search');
const suggestions = document.querySelectorAll('.suggestion-tag');

// Image Upload
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewZone = document.getElementById('preview-zone');
const imgPreview = document.getElementById('img-preview');
const btnClearImg = document.getElementById('btn-clear-img');

// Delivery
const destCountrySelect = document.getElementById('dest-country');

// Results
const resultsEmpty = document.getElementById('results-empty');
const resultsFilled = document.getElementById('results-filled');
const closeResults = document.getElementById('close-results');
const resProductImage = document.getElementById('res-product-image');
const resProductTitle = document.getElementById('res-product-title');
const resProductCategory = document.getElementById('res-product-category');
const offerCardsList = document.getElementById('offer-cards-list');
const currentSearchStatus = document.getElementById('current-search-status');

// Globe Controls
const btnAutoRotate = document.getElementById('globe-auto-rotate');
const btnResetView = document.getElementById('globe-reset-view');

// Modal
const costModal = document.getElementById('cost-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalBasePrice = document.getElementById('modal-base-price');
const modalConvertedPrice = document.getElementById('modal-converted-price');
const modalShippingCost = document.getElementById('modal-shipping-cost');
const modalDutyCost = document.getElementById('modal-duty-cost');
const modalTotalPrice = document.getElementById('modal-total-price');
const deliveryTimeline = document.getElementById('delivery-timeline');
const modalBuyLink = document.getElementById('modal-buy-link');

// =======================================================================
// SCROLL / NAVIGATION
// =======================================================================

function scrollToSearch() {
    document.getElementById('search-section').scrollIntoView({ behavior: 'smooth' });
}

function scrollToGlobe() {
    document.getElementById('hero-globe').scrollIntoView({ behavior: 'smooth' });
}

btnScrollDown.addEventListener('click', scrollToSearch);
scrollIndicator.addEventListener('click', scrollToSearch);
btnBackToGlobe.addEventListener('click', scrollToGlobe);

// Fade hero CTA on scroll
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const opacity = Math.max(0, 1 - scrollY / (vh * 0.4));
    heroCta.style.opacity = opacity;
    scrollIndicator.style.opacity = opacity;
});

// =======================================================================
// MAPLIBRE GLOBE INITIALIZATION
// =======================================================================

function initMapLibreGlobe() {
    map = new maplibregl.Map({
        container: 'globe-3d',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [30, 20],
        zoom: 1.5,
        antialias: true
    });

    // Navigation controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left');

    // Auto-rotate loop
    let lastTime = 0;
    function rotateLoop(time) {
        if (autoRotateActive && map && !map.isMoving()) {
            const center = map.getCenter();
            center.lng += 0.04;
            if (center.lng > 180) center.lng -= 360;
            map.setCenter(center);
        }
        requestAnimationFrame(rotateLoop);
    }
    requestAnimationFrame(rotateLoop);

    // On style load — enable globe + apply theme
    map.on('style.load', () => {
        // Enable 3D Globe projection (MapLibre v5+)
        try {
            map.setProjection({ type: 'globe' });
        } catch (e) {
            console.warn('Globe projection not available:', e);
        }

        applyEarthGlobeTheme();
        drawStaticHubMarkers();
    });

    // Pause rotation on user interaction, resume after
    map.on('mousedown', () => { autoRotateActive = false; });
    map.on('touchstart', () => { autoRotateActive = false; });
    map.on('moveend', () => {
        // Re-enable auto-rotate after 5 seconds of no interaction
        clearTimeout(map._autoRotateTimeout);
        map._autoRotateTimeout = setTimeout(() => {
            if (btnAutoRotate.classList.contains('active')) {
                autoRotateActive = true;
            }
        }, 5000);
    });

    // URL search parameter
    const searchParam = new URLSearchParams(window.location.search).get('search');
    if (searchParam) {
        setTimeout(() => {
            searchInput.value = searchParam;
            performSearch(searchParam);
            scrollToSearch();
        }, 1500);
    }
}

// =======================================================================
// EARTH-LIKE GLOBE THEME  (visible land, ocean, borders, country names)
// =======================================================================

function applyEarthGlobeTheme() {
    if (!map) return;

    // Sky / atmosphere for globe projection
    try {
        map.setSky({
            'sky-color': '#e0f2fe',
            'sky-horizon-blend': 0.7,
            'horizon-color': '#bae6fd',
            'horizon-fog-blend': 0.5,
            'fog-color': '#e0f2fe',
            'fog-ground-blend': 0.4
        });
    } catch (e) { /* setSky may not be available */ }

    const layers = map.getStyle().layers;
    for (const layer of layers) {
        try {
            // — Background (space behind the globe)
            if (layer.type === 'background') {
                map.setPaintProperty(layer.id, 'background-color', '#e0f2fe');
            }

            // — Water: bright ocean blue
            else if (layer.type === 'fill' && layer.id.includes('water')) {
                map.setPaintProperty(layer.id, 'fill-color', '#7dd3fc');
            }
            else if (layer.type === 'line' && layer.id.includes('water')) {
                map.setPaintProperty(layer.id, 'line-color', '#38bdf8');
            }

            // — Land masses: visible light grey-blue
            else if (layer.type === 'fill' && (layer.id.includes('land') || layer.id.includes('earth'))) {
                map.setPaintProperty(layer.id, 'fill-color', '#f8fafc');
            }

            // — Country fills (if any)
            else if (layer.type === 'fill' && layer.id.includes('country')) {
                map.setPaintProperty(layer.id, 'fill-color', '#f1f5f9');
            }

            // — Borders / boundaries: soft blue/grey lines
            else if (layer.type === 'line' && (layer.id.includes('border') || layer.id.includes('boundary'))) {
                map.setPaintProperty(layer.id, 'line-color', 'rgba(148, 163, 184, 0.6)');
                try {
                    map.setPaintProperty(layer.id, 'line-width', 1.2);
                } catch (e) {}
            }

            // — Country / city labels: dark enough to read on light
            else if (layer.type === 'symbol') {
                map.setPaintProperty(layer.id, 'text-color', '#334155');
                try {
                    map.setPaintProperty(layer.id, 'text-halo-color', 'rgba(255, 255, 255, 0.8)');
                    map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
                } catch (e) {}
            }

            // — Roads: very subtle
            else if (layer.type === 'line' && (layer.id.includes('road') || layer.id.includes('highway'))) {
                map.setPaintProperty(layer.id, 'line-color', 'rgba(148, 163, 184, 0.25)');
            }

        } catch (e) {
            // Some layers don't support paint props — skip
        }
    }
}

// =======================================================================
// MARKERS
// =======================================================================

function injectMarkerStyles() {
    if (document.getElementById('map-marker-styles')) return;
    const style = document.createElement('style');
    style.id = 'map-marker-styles';
    style.textContent = `
        .map-glow-marker {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .marker-pulse {
            width: 16px;
            height: 16px;
            background: #06b6d4;
            border: 2.5px solid rgba(255,255,255,0.9);
            border-radius: 50%;
            box-shadow: 0 0 18px #06b6d4, 0 0 40px rgba(6, 182, 212, 0.35);
            cursor: pointer;
            transition: transform 0.25s, background 0.25s;
            animation: markerPulseAnim 2.5s ease-in-out infinite;
        }
        @keyframes markerPulseAnim {
            0%, 100% { box-shadow: 0 0 12px #06b6d4, 0 0 25px rgba(6, 182, 212, 0.3); }
            50% { box-shadow: 0 0 22px #06b6d4, 0 0 50px rgba(6, 182, 212, 0.5); }
        }
        .marker-pulse:hover {
            transform: scale(1.3);
            background: #8b5cf6;
            box-shadow: 0 0 25px #8b5cf6;
        }
        .marker-label {
            position: absolute;
            top: 24px;
            background: rgba(10, 10, 25, 0.9);
            backdrop-filter: blur(6px);
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
            white-space: nowrap;
            letter-spacing: 0.5px;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .marker-dest .marker-pulse {
            background: #10b981;
            box-shadow: 0 0 18px #10b981, 0 0 40px rgba(16, 185, 129, 0.5);
            animation: none;
        }
        .marker-dest .marker-label {
            border-color: #10b981;
            color: #10b981;
        }
    `;
    document.head.appendChild(style);
}

function drawStaticHubMarkers() {
    activeMarkers.forEach(m => m.remove());
    activeMarkers = [];
    injectMarkerStyles();

    Object.keys(REGIONS_COORDS).forEach(key => {
        const hub = REGIONS_COORDS[key];
        const el = document.createElement('div');
        el.className = 'map-glow-marker';
        el.innerHTML = `
            <div class="marker-pulse"></div>
            <div class="marker-label">${hub.label}</div>
        `;
        const marker = new maplibregl.Marker(el)
            .setLngLat([hub.lng, hub.lat])
            .addTo(map);
        activeMarkers.push(marker);
    });
}

// =======================================================================
// GLOBE CONTROLS
// =======================================================================

btnAutoRotate.addEventListener('click', () => {
    autoRotateActive = !autoRotateActive;
    btnAutoRotate.classList.toggle('active', autoRotateActive);
});

btnResetView.addEventListener('click', () => {
    map.flyTo({
        center: [30, 20],
        zoom: 1.5,
        speed: 1.2,
        essential: true
    });
});

// =======================================================================
// SEARCH
// =======================================================================

// Dropzone
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-cyan)';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    if (e.dataTransfer.files.length > 0) handleImageUpload(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleImageUpload(e.target.files[0]);
});

// =======================================================================
// LOCAL AI VISION RECOGNITION (via Open WebUI / Ollama on 8081)
// =======================================================================

const aiStatusBadge = document.getElementById('ai-status');
const scanOverlay = document.getElementById('scan-overlay');
const aiResultsBox = document.getElementById('ai-results');
const aiTagsContainer = document.getElementById('ai-tags');

// --- LOCAL AI CONFIGURATION ---
const LOCAL_AI_URL = 'http://127.0.0.1:8081/v1/chat/completions';
const LOCAL_AI_MODEL = 'Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced-Q4_K_M.gguf'; // Пользовательская модель
const LOCAL_AI_TOKEN = ''; // Если Open WebUI требует токен (Bearer), вставьте сюда. Иначе оставьте пустым.

function initAIModel() {
    aiStatusBadge.textContent = 'Local AI (8081)';
    aiStatusBadge.className = 'ai-badge ready';
}
initAIModel();

function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        imgPreview.src = base64Image;
        
        dropZone.style.display = 'none';
        previewZone.style.display = 'block';
        scanOverlay.style.display = 'flex';
        aiResultsBox.style.display = 'none';
        aiTagsContainer.innerHTML = '';
        currentSearchStatus.textContent = 'Отправка фото в локальную нейросеть...';
        
        try {
            // Wait for image to render
            await new Promise(resolve => {
                imgPreview.onload = resolve;
                if (imgPreview.complete) resolve();
            });

            // Формируем запрос в формате OpenAI, который поддерживает Open WebUI
            const headers = { 'Content-Type': 'application/json' };
            if (LOCAL_AI_TOKEN) {
                headers['Authorization'] = `Bearer ${LOCAL_AI_TOKEN}`;
            }

            console.log('Sending request to Local AI:', LOCAL_AI_URL);
            
            const response = await fetch(LOCAL_AI_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: LOCAL_AI_MODEL,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "You are a product scanner. Identify the main product in this image. Reply with ONLY 2-3 keywords that describe the product (e.g., 'iphone smartphone apple' or 'dyson hair dryer' or 'sony headphones'). Do not use full sentences." },
                                { type: "image_url", image_url: { url: base64Image } }
                            ]
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const aiResponseText = data.choices[0].message.content.trim();
            console.log('AI Response:', aiResponseText);
            
            scanOverlay.style.display = 'none';
            aiResultsBox.style.display = 'block';
            
            // Render tags from AI response
            const keywords = aiResponseText.split(/[\s,]+/).filter(w => w.length > 2);
            keywords.forEach(kw => {
                const tag = document.createElement('div');
                tag.className = 'ai-tag';
                tag.innerHTML = `${kw.toUpperCase()}`;
                aiTagsContainer.appendChild(tag);
            });
            
            currentSearchStatus.textContent = 'Ищем совпадения в базе...';
            
            // Match with mock DB
            setTimeout(() => {
                const matchedProduct = findProductByKeywords(keywords);
                
                if (matchedProduct) {
                    displayProductResults(matchedProduct);
                } else {
                    currentSearchStatus.textContent = 'Товар не найден в базе.';
                    alert('К сожалению, мы не нашли этот товар в базе. AI определил это как: ' + aiResponseText);
                }
            }, 800);
            
        } catch (err) {
            console.error("Local AI Classification error:", err);
            scanOverlay.style.display = 'none';
            currentSearchStatus.textContent = 'Ошибка AI: ' + err.message;
            alert('Ошибка подключения к локальному AI. Убедитесь, что Open WebUI запущен, поддерживает CORS, и указана верная Vision-модель.');
        }
    };
    reader.readAsDataURL(file);
}

function findProductByKeywords(aiKeywords) {
    // Try to match AI keywords with our DB keywords
    const aiLower = aiKeywords.map(k => k.toLowerCase());
    
    // Sort products by match score
    const scoredProducts = PRODUCTS_DB.map(prod => {
        let score = 0;
        prod.keywords.forEach(dbKw => {
            if (aiLower.some(aiKw => aiKw.includes(dbKw) || dbKw.includes(aiKw))) {
                score++;
            }
        });
        return { product: prod, score };
    }).sort((a, b) => b.score - a.score);
    
    // If the top product has at least 1 match, return it
    if (scoredProducts.length > 0 && scoredProducts[0].score > 0) {
        return scoredProducts[0].product;
    }
    
    // If no direct matches, randomly return something for demo purposes 
    // (since MobileNet might predict "cellular telephone" instead of "iphone")
    const isPhoneOrTech = aiLower.some(k => k.includes('phone') || k.includes('cellular') || k.includes('electronic'));
    if (isPhoneOrTech) return PRODUCTS_DB[0]; // iPhone
    
    const isAudio = aiLower.some(k => k.includes('headphone') || k.includes('audio') || k.includes('earphone'));
    if (isAudio) return PRODUCTS_DB[2]; // Sony
    
    const isBag = aiLower.some(k => k.includes('bag') || k.includes('purse') || k.includes('leather'));
    if (isBag) return PRODUCTS_DB[3]; // Chanel
    
    return null;
}

btnClearImg.addEventListener('click', () => {
    fileInput.value = '';
    previewZone.style.display = 'none';
    dropZone.style.display = 'block';
    scanOverlay.style.display = 'none';
    aiResultsBox.style.display = 'none';
    currentSearchStatus.textContent = 'Ожидание запроса...';
    hideResults();
});

// Suggestions
suggestions.forEach(tag => {
    tag.addEventListener('click', () => {
        searchInput.value = tag.textContent;
        performSearch(tag.textContent);
    });
});

// Search button + Enter
btnSearch.addEventListener('click', () => performSearch(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch(searchInput.value);
});

function performSearch(query) {
    if (!query.trim()) return;

    currentSearchStatus.textContent = `Поиск: "${query}"...`;

    const lowerQuery = query.toLowerCase();
    let result = PRODUCTS_DB.find(prod =>
        prod.title.toLowerCase().includes(lowerQuery) ||
        prod.keywords.some(kw => lowerQuery.includes(kw) || kw.includes(lowerQuery))
    );

    if (!result) {
        // Динамически генерируем товар, если его нет в моковой БД
        const randomPrice = Math.floor(Math.random() * 800) + 50;
        result = {
            id: 'dynamic-' + Date.now(),
            title: query.charAt(0).toUpperCase() + query.slice(1),
            category: 'Найденный товар',
            image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=150&q=80', // generic box
            keywords: [lowerQuery],
            offers: [
                { id: 'off-us', store: 'Amazon (USA)', region: 'US', basePriceUSD: randomPrice, shippingUSD: 30, deliveryDays: '10-14 дней', storeSearchUrl: 'https://www.amazon.com/s?k=' },
                { id: 'off-eu', store: 'eBay (Europe)', region: 'EU', basePriceUSD: randomPrice - 10, shippingUSD: 25, deliveryDays: '8-12 дней', storeSearchUrl: 'https://www.ebay.com/sch/i.html?_nkw=' },
                { id: 'off-asia', store: 'AliExpress (China)', region: 'ASIA', basePriceUSD: randomPrice - 20, shippingUSD: 15, deliveryDays: '15-25 дней', storeSearchUrl: 'https://www.aliexpress.com/w/wholesale-' },
                { id: 'off-ru', store: 'WowS Express (Russia)', region: 'RU', basePriceUSD: randomPrice + 50, shippingUSD: 5, deliveryDays: '1-3 дня', storeSearchUrl: 'https://market.yandex.ru/search?text=' }
            ]
        };
    }

    displayProductResults(result);
}

// Destination selector
destCountrySelect.addEventListener('change', (e) => {
    currentDestination = e.target.value;
    updateOffersList();
    if (selectedProduct) drawMapRoutes();
});

// =======================================================================
// RESULTS DISPLAY
// =======================================================================

function displayProductResults(product) {
    selectedProduct = product;

    resProductImage.src = product.image;
    resProductTitle.textContent = product.title;
    resProductCategory.textContent = product.category;

    updateOffersList();

    // Toggle empty → filled
    resultsEmpty.style.display = 'none';
    resultsFilled.style.display = 'flex';
    currentSearchStatus.textContent = `Найдено: ${product.title}`;

    drawMapRoutes();
}

function updateOffersList() {
    if (!selectedProduct) return;

    offerCardsList.innerHTML = '';
    const destMeta = DEST_COUNTRIES_META[currentDestination];

    selectedProduct.offers.forEach(offer => {
        const prices = calculateFullCost(offer, destMeta);

        const card = document.createElement('div');
        card.className = 'offer-card';
        if (selectedOffer && selectedOffer.id === offer.id) card.classList.add('selected');

        card.innerHTML = `
            <div class="offer-top">
                <span class="store-badge">${offer.store}</span>
                <span class="store-country">
                    <i class="fa-solid fa-plane-departure"></i> ${offer.region}
                </span>
            </div>
            <div class="offer-mid">
                <div class="offer-price">$${offer.basePriceUSD}</div>
                <div class="total-estimate">
                    <span>Итого с пошлиной:</span>
                    <strong>${formatCurrency(prices.totalConverted, destMeta.currency)}</strong>
                </div>
            </div>
            <div class="delivery-badge-tag ${offer.deliveryDays.includes('1-') ? 'fast' : ''}">
                <i class="fa-solid fa-truck-fast"></i> ${offer.deliveryDays}
            </div>
        `;

        card.addEventListener('click', () => {
            document.querySelectorAll('.offer-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            openBreakdownModal(offer, prices);

            // Fly globe to source region
            const srcCoords = REGIONS_COORDS[offer.region];
            if (srcCoords) {
                scrollToGlobe();
                setTimeout(() => {
                    map.flyTo({
                        center: [srcCoords.lng, srcCoords.lat],
                        zoom: 3.5,
                        duration: 1800,
                        essential: true
                    });
                }, 400);
            }
        });

        offerCardsList.appendChild(card);
    });
}

closeResults.addEventListener('click', () => hideResults());

function hideResults() {
    resultsEmpty.style.display = 'flex';
    resultsFilled.style.display = 'none';
    selectedProduct = null;
    selectedOffer = null;
    removeMapRoutes();
    drawStaticHubMarkers();
}

// =======================================================================
// CALCULATOR
// =======================================================================

function calculateFullCost(offer, destMeta) {
    const basePriceUSD = offer.basePriceUSD;
    const shippingUSD = offer.shippingUSD;

    let dutyUSD = 0;
    if (basePriceUSD > destMeta.dutyThresholdUSD) {
        dutyUSD = (basePriceUSD - destMeta.dutyThresholdUSD) * destMeta.dutyRate + destMeta.dutyFixedFeeUSD;
    }

    const totalUSD = basePriceUSD + shippingUSD + dutyUSD;
    const totalConverted = totalUSD * destMeta.rateToUSD;
    const baseConverted = basePriceUSD * destMeta.rateToUSD;

    return { basePriceUSD, shippingUSD, dutyUSD, totalUSD, totalConverted, baseConverted };
}

function formatCurrency(val, currency) {
    if (currency === '₽') return `${Math.round(val).toLocaleString('ru-RU')} ₽`;
    if (currency === '€') return `€${Math.round(val).toLocaleString('de-DE')}`;
    if (currency === '¥') return `¥${Math.round(val).toLocaleString('ja-JP')}`;
    return `$${val.toFixed(2)}`;
}

// =======================================================================
// MAP ROUTING (GeoJSON lines)
// =======================================================================

function removeMapRoutes() {
    if (!map) return;
    try {
        if (map.getLayer('routes-glow')) map.removeLayer('routes-glow');
        if (map.getLayer('routes-layer')) map.removeLayer('routes-layer');
        if (map.getSource('routes-source')) map.removeSource('routes-source');
    } catch (e) {}
}

function createArcRoute(start, end) {
    const coords = [];
    const steps = 50;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const px = -dy;
    const py = dx;
    const length = Math.sqrt(px * px + py * py);
    const bendFactor = 0.18;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        let x = start[0] + dx * t;
        let y = start[1] + dy * t;
        const curve = Math.sin(t * Math.PI);
        if (length > 0) {
            x += (px / length) * bendFactor * length * curve;
            y += (py / length) * bendFactor * length * curve;
        }
        coords.push([x, y]);
    }
    return coords;
}

function drawMapRoutes() {
    if (!map || !selectedProduct) return;

    removeMapRoutes();

    const destMeta = DEST_COUNTRIES_META[currentDestination];
    const destCoords = [destMeta.lng, destMeta.lat];

    const features = [];

    selectedProduct.offers.forEach(offer => {
        if (offer.region === currentDestination) return;
        const src = REGIONS_COORDS[offer.region];
        if (!src) return;

        const curvedCoords = createArcRoute([src.lng, src.lat], destCoords);
        const color = offer.region === 'US' ? '#3b82f6' :
                      offer.region === 'EU' ? '#f59e0b' :
                      offer.region === 'RU' ? '#10b981' : '#ef4444';

        features.push({
            type: 'Feature',
            properties: { color },
            geometry: { type: 'LineString', coordinates: curvedCoords }
        });
    });

    map.addSource('routes-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features }
    });

    // Glow layer (wider, transparent)
    map.addLayer({
        id: 'routes-glow',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
            'line-color': ['get', 'color'],
            'line-width': 7,
            'line-opacity': 0.2
        }
    });

    // Main route line
    map.addLayer({
        id: 'routes-layer',
        type: 'line',
        source: 'routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
            'line-color': ['get', 'color'],
            'line-width': 2.5,
            'line-opacity': 0.9,
            'line-dasharray': [4, 2]
        }
    });

    // Update markers to highlight destination
    activeMarkers.forEach(m => m.remove());
    activeMarkers = [];

    Object.keys(REGIONS_COORDS).forEach(key => {
        const hub = REGIONS_COORDS[key];
        const isDest = (key === 'RU' && currentDestination === 'RU') ||
                       (key === 'US' && currentDestination === 'US') ||
                       (key === 'EU' && currentDestination === 'DE') ||
                       (key === 'ASIA' && currentDestination === 'JP');

        const el = document.createElement('div');
        el.className = `map-glow-marker ${isDest ? 'marker-dest' : ''}`;
        el.innerHTML = `
            <div class="marker-pulse"></div>
            <div class="marker-label">${isDest ? `🎯 ${hub.label}` : hub.label}</div>
        `;

        const marker = new maplibregl.Marker(el)
            .setLngLat([hub.lng, hub.lat])
            .addTo(map);
        activeMarkers.push(marker);
    });

    // Fly to show the destination
    map.flyTo({
        center: [destMeta.lng, destMeta.lat],
        zoom: 2.2,
        speed: 1.1,
        curve: 1.4,
        essential: true
    });
}

// =======================================================================
// MODAL
// =======================================================================

function openBreakdownModal(offer, prices) {
    selectedOffer = offer;
    const destMeta = DEST_COUNTRIES_META[currentDestination];

    modalBasePrice.textContent = `$${prices.basePriceUSD}`;
    modalConvertedPrice.textContent = formatCurrency(prices.baseConverted, destMeta.currency);
    modalShippingCost.textContent = `$${prices.shippingUSD}`;
    modalDutyCost.textContent = prices.dutyUSD > 0 ? `$${prices.dutyUSD.toFixed(2)}` : 'Пошлина $0 (под лимитом)';
    modalTotalPrice.textContent = formatCurrency(prices.totalConverted, destMeta.currency);
    
    // Генерируем реальную ссылку на поиск товара
    let actualLink = offer.link;
    if (offer.storeSearchUrl) {
        actualLink = offer.storeSearchUrl + encodeURIComponent(selectedProduct.title);
    } else {
        // Fallback for static DB items to make them realistic
        if (offer.store.includes('Amazon')) actualLink = 'https://www.amazon.com/s?k=' + encodeURIComponent(selectedProduct.title);
        else if (offer.store.includes('eBay') || offer.store.includes('BestBuy')) actualLink = 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(selectedProduct.title);
        else if (offer.store.includes('AliExpress') || offer.store.includes('Taobao') || offer.store.includes('JD.com') || offer.store.includes('Tmall')) actualLink = 'https://www.aliexpress.com/w/wholesale-' + encodeURIComponent(selectedProduct.title) + '.html';
        else actualLink = 'https://www.google.com/search?q=' + encodeURIComponent(offer.store + ' ' + selectedProduct.title);
    }
    
    modalBuyLink.href = actualLink;

    deliveryTimeline.innerHTML = `
        <div class="timeline-step active">
            <div class="step-title">Выкуп товара — ${offer.store}</div>
            <div class="step-desc">Оформление партнерской сделки (${offer.region})</div>
        </div>
        <div class="timeline-step">
            <div class="step-title">Консолидация на хабе WowS</div>
            <div class="step-desc">Проверка упаковки и декларация товара</div>
        </div>
        <div class="timeline-step">
            <div class="step-title">Растаможка</div>
            <div class="step-desc">Пошлина: ${formatCurrency(prices.dutyUSD * destMeta.rateToUSD, destMeta.currency)}</div>
        </div>
        <div class="timeline-step">
            <div class="step-title">Доставка (${offer.deliveryDays})</div>
            <div class="step-desc">Передача локальной службе → пункт выдачи</div>
        </div>
    `;

    costModal.style.display = 'flex';
}

btnCloseModal.addEventListener('click', () => { costModal.style.display = 'none'; });
costModal.addEventListener('click', (e) => {
    if (e.target === costModal) costModal.style.display = 'none';
});

// =======================================================================
// INIT
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    initMapLibreGlobe();
});
