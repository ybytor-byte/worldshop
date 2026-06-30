import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedOffer {
  shop: string;
  price: number;
  currency: string;
  region: string;
  shippingUSD: number;
  deliveryDays: string;
  url: string;
  variant: string;
}

interface SeedProduct {
  brand: string;
  model: string;
  specs: Record<string, string>;
  variants: { name: string; specs: Record<string, string> }[];
  offers: SeedOffer[];
}

const REGION_SHOPS: Record<string, { shop: string; url: (q: string) => string }[]> = {
  US: [
    { shop: 'Amazon (USA)', url: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
    { shop: 'Best Buy', url: (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(q)}` },
  ],
  EU: [
    { shop: 'MediaMarkt (DE)', url: (q) => `https://www.mediamarkt.de/de/search.html?query=${encodeURIComponent(q)}` },
    { shop: 'Fnac (FR)', url: (q) => `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${encodeURIComponent(q)}` },
  ],
  ASIA: [
    { shop: 'AliExpress', url: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}` },
    { shop: 'JD.com', url: (q) => `https://www.jd.com/search?keyword=${encodeURIComponent(q)}` },
  ],
  RU: [
    { shop: 'Ozon', url: (q) => `https://www.ozon.ru/search/?text=${encodeURIComponent(q)}` },
    { shop: 'Wildberries', url: (q) => `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(q)}` },
    { shop: 'DNS', url: (q) => `https://www.dns-shop.ru/search/?q=${encodeURIComponent(q)}` },
    { shop: 'М.Видео', url: (q) => `https://www.mvideo.ru/product-list-page?q=${encodeURIComponent(q)}` },
    { shop: 'Яндекс.Маркет', url: (q) => `https://market.yandex.ru/search?text=${encodeURIComponent(q)}` },
  ],
};

const CURRENCIES: Record<string, string> = { US: 'USD', EU: 'EUR', ASIA: 'USD', RU: 'RUB' };

const RATES: Record<string, number> = { US: 1, EU: 0.92, ASIA: 1, RU: 92.5 };

function priceInRegion(priceUSD: number, region: string): number {
  return Math.round(priceUSD * RATES[region]);
}

function days(d: number) {
  return `${d - 3}-${d + 2} дня`;
}

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

const seedData: SeedProduct[] = [
  {
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    specs: { display: '6.7" OLED', chip: 'A17 Pro', battery: '4422mAh' },
    variants: [
      { name: '256GB', specs: { ram: '8GB', storage: '256GB' } },
      { name: '512GB', specs: { ram: '8GB', storage: '512GB' } },
      { name: '1TB', specs: { ram: '8GB', storage: '1TB' } },
    ],
    offers: [
      ...['256GB', '512GB', '1TB'].flatMap((v) => {
        const base = { 256: 1199, 512: 1399, 1: 1599 };
        const usd = base[v === '1TB' ? 1 : (v === '512GB' ? 512 : 256)];
        const query = `iPhone 15 Pro Max ${v}`;
        return [
          ...REGION_SHOPS.US.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd, 'US'), currency: CURRENCIES.US, region: 'US', shippingUSD: 45, deliveryDays: days(12), url: s.url(query), variant: v })),
          ...REGION_SHOPS.EU.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.08), 'EU'), currency: CURRENCIES.EU, region: 'EU', shippingUSD: 35, deliveryDays: days(10), url: s.url(query), variant: v })),
          ...REGION_SHOPS.ASIA.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd - 50, 'ASIA'), currency: CURRENCIES.ASIA, region: 'ASIA', shippingUSD: 25, deliveryDays: days(15), url: s.url(query), variant: v })),
          ...REGION_SHOPS.RU.slice(0, 2).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.25), 'RU'), currency: CURRENCIES.RU, region: 'RU', shippingUSD: 5, deliveryDays: days(3), url: s.url(query), variant: v })),
        ];
      }),
    ],
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    specs: { display: '6.8" Dynamic AMOLED', chip: 'Snapdragon 8 Gen 3', battery: '5000mAh' },
    variants: [
      { name: '256GB', specs: { ram: '12GB', storage: '256GB' } },
      { name: '512GB', specs: { ram: '12GB', storage: '512GB' } },
      { name: '1TB', specs: { ram: '12GB', storage: '1TB' } },
    ],
    offers: [
      ...['256GB', '512GB', '1TB'].flatMap((v) => {
        const base = { 256: 999, 512: 1199, 1: 1399 };
        const usd = base[v === '1TB' ? 1 : (v === '512GB' ? 512 : 256)];
        const query = `Samsung Galaxy S24 Ultra ${v}`;
        return [
          ...REGION_SHOPS.US.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd, 'US'), currency: CURRENCIES.US, region: 'US', shippingUSD: 40, deliveryDays: days(10), url: s.url(query), variant: v })),
          ...REGION_SHOPS.EU.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.1), 'EU'), currency: CURRENCIES.EU, region: 'EU', shippingUSD: 30, deliveryDays: days(9), url: s.url(query), variant: v })),
          ...REGION_SHOPS.ASIA.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd - 40, 'ASIA'), currency: CURRENCIES.ASIA, region: 'ASIA', shippingUSD: 20, deliveryDays: days(14), url: s.url(query), variant: v })),
          ...REGION_SHOPS.RU.slice(0, 2).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.3), 'RU'), currency: CURRENCIES.RU, region: 'RU', shippingUSD: 5, deliveryDays: days(3), url: s.url(query), variant: v })),
        ];
      }),
    ],
  },
  {
    brand: 'Sony',
    model: 'WH-1000XM5',
    specs: { type: 'Беспроводные наушники', noise_cancel: 'Активное', battery: '30 часов', codec: 'LDAC', weight: '250g' },
    variants: [
      { name: 'Чёрные', specs: { color: 'Чёрный' } },
      { name: 'Серебристые', specs: { color: 'Серебристый' } },
      { name: 'Midnight Blue', specs: { color: 'Тёмно-синий' } },
    ],
    offers: [
      ...[{ v: 'Чёрные', q: 'Sony WH-1000XM5 Black' }, { v: 'Серебристые', q: 'Sony WH-1000XM5 Silver' }, { v: 'Midnight Blue', q: 'Sony WH-1000XM5 Midnight Blue' }].flatMap(({ v, q }) => {
        const usd = v === 'Midnight Blue' ? 410 : 398;
        return [
          ...REGION_SHOPS.US.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd, 'US'), currency: CURRENCIES.US, region: 'US', shippingUSD: 25, deliveryDays: days(10), url: s.url(q), variant: v })),
          ...REGION_SHOPS.EU.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.05), 'EU'), currency: CURRENCIES.EU, region: 'EU', shippingUSD: 20, deliveryDays: days(8), url: s.url(q), variant: v })),
          ...REGION_SHOPS.ASIA.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd - 30, 'ASIA'), currency: CURRENCIES.ASIA, region: 'ASIA', shippingUSD: 15, deliveryDays: days(12), url: s.url(q), variant: v })),
          ...REGION_SHOPS.RU.slice(0, 2).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.15), 'RU'), currency: CURRENCIES.RU, region: 'RU', shippingUSD: 5, deliveryDays: days(2), url: s.url(q), variant: v })),
        ];
      }),
    ],
  },
  {
    brand: 'Dyson',
    model: 'Airwrap Complete Long',
    specs: { type: 'Стайлер', power: '1300W', heat: '3 режима', warranty: '2 года' },
    variants: [
      { name: 'Стандарт', specs: { attachments: '6 насадок', color: 'Никель/Розовое золото' } },
      { name: 'Премиум', specs: { attachments: '8 насадок', color: 'Никель/Медь' } },
    ],
    offers: [
      ...[{ v: 'Стандарт', q: 'Dyson Airwrap Complete Long', usd: 599 }, { v: 'Премиум', q: 'Dyson Airwrap Premium', usd: 699 }].flatMap(({ v, q, usd }) => [
        ...REGION_SHOPS.US.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd, 'US'), currency: CURRENCIES.US, region: 'US', shippingUSD: 35, deliveryDays: days(13), url: s.url(q), variant: v })),
        ...REGION_SHOPS.EU.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.06), 'EU'), currency: CURRENCIES.EU, region: 'EU', shippingUSD: 28, deliveryDays: days(11), url: s.url(q), variant: v })),
        ...REGION_SHOPS.ASIA.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd - 40, 'ASIA'), currency: CURRENCIES.ASIA, region: 'ASIA', shippingUSD: 22, deliveryDays: days(16), url: s.url(q), variant: v })),
        ...REGION_SHOPS.RU.slice(0, 2).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.35), 'RU'), currency: CURRENCIES.RU, region: 'RU', shippingUSD: 5, deliveryDays: days(3), url: s.url(q), variant: v })),
      ]),
    ],
  },
  {
    brand: 'Chanel',
    model: 'Classic Double Flap Bag',
    specs: { material: 'Кожа ягнёнка', hardware: 'Золото', origin: 'Франция' },
    variants: [
      { name: 'Small (25см)', specs: { size: '25см', color: 'Чёрный' } },
      { name: 'Medium (30см)', specs: { size: '30см', color: 'Чёрный' } },
    ],
    offers: [
      ...[{ v: 'Small (25см)', q: 'Chanel Classic Double Flap Bag 25', usd: 9700 }, { v: 'Medium (30см)', q: 'Chanel Classic Double Flap Bag 30', usd: 10800 }].flatMap(({ v, q, usd }) => [
        ...REGION_SHOPS.US.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd, 'US'), currency: CURRENCIES.US, region: 'US', shippingUSD: 150, deliveryDays: days(17), url: s.url(q), variant: v })),
        ...REGION_SHOPS.EU.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 0.95), 'EU'), currency: CURRENCIES.EU, region: 'EU', shippingUSD: 120, deliveryDays: days(14), url: s.url(q), variant: v })),
        ...REGION_SHOPS.ASIA.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.03), 'ASIA'), currency: CURRENCIES.ASIA, region: 'ASIA', shippingUSD: 100, deliveryDays: days(16), url: s.url(q), variant: v })),
        ...REGION_SHOPS.RU.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.4), 'RU'), currency: CURRENCIES.RU, region: 'RU', shippingUSD: 10, deliveryDays: days(3), url: s.url(q), variant: v })),
      ]),
    ],
  },
  {
    brand: 'Xiaomi',
    model: 'Robot Vacuum X20+',
    specs: { type: 'Робот-пылесос', suction: '6000Pa', navigation: 'LDS+LiDAR', mopping: 'Есть' },
    variants: [
      { name: 'Стандарт', specs: { battery: '5200mAh', color: 'Белый' } },
      { name: 'Плюс станция', specs: { battery: '5200mAh', self_cleaning: 'Есть', color: 'Чёрный' } },
    ],
    offers: [
      ...[{ v: 'Стандарт', q: 'Xiaomi Robot Vacuum X20+', usd: 349 }, { v: 'Плюс станция', q: 'Xiaomi Robot Vacuum X20+ Station', usd: 449 }].flatMap(({ v, q, usd }) => [
        ...REGION_SHOPS.US.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd, 'US'), currency: CURRENCIES.US, region: 'US', shippingUSD: 30, deliveryDays: days(11), url: s.url(q), variant: v })),
        ...REGION_SHOPS.EU.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.07), 'EU'), currency: CURRENCIES.EU, region: 'EU', shippingUSD: 25, deliveryDays: days(9), url: s.url(q), variant: v })),
        ...REGION_SHOPS.ASIA.slice(0, 1).map((s) => ({ shop: s.shop, price: priceInRegion(usd - 50, 'ASIA'), currency: CURRENCIES.ASIA, region: 'ASIA', shippingUSD: 18, deliveryDays: days(14), url: s.url(q), variant: v })),
        ...REGION_SHOPS.RU.slice(0, 2).map((s) => ({ shop: s.shop, price: priceInRegion(Math.round(usd * 1.3), 'RU'), currency: CURRENCIES.RU, region: 'RU', shippingUSD: 5, deliveryDays: days(3), url: s.url(q), variant: v })),
      ]),
    ],
  },
];

async function main() {
  console.log('Seeding...');
  await prisma.offer.deleteMany();
  await prisma.productScan.deleteMany();
  await prisma.product.deleteMany();

  for (const item of seedData) {
    const product = await prisma.product.create({
      data: {
        brand: item.brand,
        model: item.model,
        specs: item.specs as any,
        offers: {
          create: item.offers.map((o) => ({
            shop: o.shop,
            price: o.price,
            currency: o.currency,
            region: o.region,
            shippingUSD: o.shippingUSD,
            deliveryDays: o.deliveryDays,
            url: o.url,
            variant: o.variant,
          })),
        },
      },
    });
    console.log(`  ${item.brand} ${item.model} — ${item.offers.length} offers`);
  }

  const counts = await Promise.all([prisma.product.count(), prisma.offer.count()]);
  console.log(`\nDone! ${counts[0]} products, ${counts[1]} offers`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
