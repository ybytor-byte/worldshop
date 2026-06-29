import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedOffer {
  shop: string;
  price: number;
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

function searchUrl(shop: string, query: string): string {
  const q = encodeURIComponent(query);
  const map: Record<string, string> = {
    Ozon: `https://www.ozon.ru/search/?text=${q}`,
    Wildberries: `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}`,
    DNS: `https://www.dns-shop.ru/search/?q=${q}`,
    'М.Видео': `https://www.mvideo.ru/product-list-page?q=${q}`,
    'Яндекс.Маркет': `https://market.yandex.ru/search?text=${q}`,
  };
  return map[shop] || `https://yandex.ru/search/?text=${q}`;
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
      { shop: 'Ozon', variant: '256GB', price: 112990, url: searchUrl('Ozon', 'iPhone 15 Pro Max 256GB') },
      { shop: 'Ozon', variant: '512GB', price: 134990, url: searchUrl('Ozon', 'iPhone 15 Pro Max 512GB') },
      { shop: 'Ozon', variant: '1TB', price: 159990, url: searchUrl('Ozon', 'iPhone 15 Pro Max 1TB') },
      { shop: 'Wildberries', variant: '256GB', price: 109999, url: searchUrl('Wildberries', 'iPhone 15 Pro Max 256GB') },
      { shop: 'Wildberries', variant: '512GB', price: 131999, url: searchUrl('Wildberries', 'iPhone 15 Pro Max 512GB') },
      { shop: 'Wildberries', variant: '1TB', price: 157999, url: searchUrl('Wildberries', 'iPhone 15 Pro Max 1TB') },
      { shop: 'DNS', variant: '256GB', price: 115999, url: searchUrl('DNS', 'iPhone 15 Pro Max 256GB') },
      { shop: 'DNS', variant: '512GB', price: 137999, url: searchUrl('DNS', 'iPhone 15 Pro Max 512GB') },
      { shop: 'DNS', variant: '1TB', price: 162999, url: searchUrl('DNS', 'iPhone 15 Pro Max 1TB') },
      { shop: 'М.Видео', variant: '256GB', price: 113999, url: searchUrl('М.Видео', 'iPhone 15 Pro Max 256GB') },
      { shop: 'М.Видео', variant: '512GB', price: 135999, url: searchUrl('М.Видео', 'iPhone 15 Pro Max 512GB') },
      { shop: 'М.Видео', variant: '1TB', price: 161999, url: searchUrl('М.Видео', 'iPhone 15 Pro Max 1TB') },
      { shop: 'Яндекс.Маркет', variant: '256GB', price: 107990, url: searchUrl('Яндекс.Маркет', 'iPhone 15 Pro Max 256GB') },
      { shop: 'Яндекс.Маркет', variant: '512GB', price: 129990, url: searchUrl('Яндекс.Маркет', 'iPhone 15 Pro Max 512GB') },
      { shop: 'Яндекс.Маркет', variant: '1TB', price: 155990, url: searchUrl('Яндекс.Маркет', 'iPhone 15 Pro Max 1TB') },
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
      { shop: 'Ozon', variant: 'Стандарт', price: 59990, url: searchUrl('Ozon', 'Dyson Airwrap Complete Long') },
      { shop: 'Ozon', variant: 'Премиум', price: 69990, url: searchUrl('Ozon', 'Dyson Airwrap Complete Long премиум') },
      { shop: 'Wildberries', variant: 'Стандарт', price: 57999, url: searchUrl('Wildberries', 'Dyson Airwrap') },
      { shop: 'Wildberries', variant: 'Премиум', price: 67999, url: searchUrl('Wildberries', 'Dyson Airwrap премиум') },
      { shop: 'М.Видео', variant: 'Стандарт', price: 61999, url: searchUrl('М.Видео', 'Dyson Airwrap Complete Long') },
      { shop: 'М.Видео', variant: 'Премиум', price: 71999, url: searchUrl('М.Видео', 'Dyson Airwrap премиум') },
      { shop: 'Яндекс.Маркет', variant: 'Стандарт', price: 55990, url: searchUrl('Яндекс.Маркет', 'Dyson Airwrap') },
      { shop: 'Яндекс.Маркет', variant: 'Премиум', price: 65990, url: searchUrl('Яндекс.Маркет', 'Dyson Airwrap премиум') },
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
      { shop: 'Ozon', variant: 'Чёрные', price: 27990, url: searchUrl('Ozon', 'Sony WH-1000XM5') },
      { shop: 'Ozon', variant: 'Серебристые', price: 27990, url: searchUrl('Ozon', 'Sony WH-1000XM5') },
      { shop: 'Ozon', variant: 'Midnight Blue', price: 28990, url: searchUrl('Ozon', 'Sony WH-1000XM5') },
      { shop: 'Wildberries', variant: 'Чёрные', price: 26999, url: searchUrl('Wildberries', 'Sony WH-1000XM5') },
      { shop: 'Wildberries', variant: 'Серебристые', price: 26999, url: searchUrl('Wildberries', 'Sony WH-1000XM5') },
      { shop: 'DNS', variant: 'Чёрные', price: 28999, url: searchUrl('DNS', 'Sony WH-1000XM5') },
      { shop: 'DNS', variant: 'Серебристые', price: 28999, url: searchUrl('DNS', 'Sony WH-1000XM5') },
      { shop: 'М.Видео', variant: 'Чёрные', price: 29999, url: searchUrl('М.Видео', 'Sony WH-1000XM5') },
      { shop: 'М.Видео', variant: 'Серебристые', price: 29999, url: searchUrl('М.Видео', 'Sony WH-1000XM5') },
      { shop: 'Яндекс.Маркет', variant: 'Чёрные', price: 25990, url: searchUrl('Яндекс.Маркет', 'Sony WH-1000XM5') },
      { shop: 'Яндекс.Маркет', variant: 'Серебристые', price: 25990, url: searchUrl('Яндекс.Маркет', 'Sony WH-1000XM5') },
      { shop: 'Яндекс.Маркет', variant: 'Midnight Blue', price: 26990, url: searchUrl('Яндекс.Маркет', 'Sony WH-1000XM5') },
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
      { shop: 'Яндекс.Маркет', variant: 'Small (25см)', price: 789000, url: searchUrl('Яндекс.Маркет', 'Chanel Classic Double Flap Bag') },
      { shop: 'Яндекс.Маркет', variant: 'Medium (30см)', price: 899000, url: searchUrl('Яндекс.Маркет', 'Chanel Classic Double Flap Bag 30') },
      { shop: 'Ozon', variant: 'Small (25см)', price: 825000, url: searchUrl('Ozon', 'Chanel Classic Double Flap') },
      { shop: 'Ozon', variant: 'Medium (30см)', price: 945000, url: searchUrl('Ozon', 'Chanel Classic Double Flap') },
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
      { shop: 'Ozon', variant: '256GB', price: 94990, url: searchUrl('Ozon', 'Samsung Galaxy S24 Ultra 256GB') },
      { shop: 'Ozon', variant: '512GB', price: 109990, url: searchUrl('Ozon', 'Samsung Galaxy S24 Ultra 512GB') },
      { shop: 'Ozon', variant: '1TB', price: 134990, url: searchUrl('Ozon', 'Samsung Galaxy S24 Ultra 1TB') },
      { shop: 'Wildberries', variant: '256GB', price: 92999, url: searchUrl('Wildberries', 'Samsung Galaxy S24 Ultra') },
      { shop: 'Wildberries', variant: '512GB', price: 107999, url: searchUrl('Wildberries', 'Samsung Galaxy S24 Ultra') },
      { shop: 'Wildberries', variant: '1TB', price: 132999, url: searchUrl('Wildberries', 'Samsung Galaxy S24 Ultra') },
      { shop: 'DNS', variant: '256GB', price: 96999, url: searchUrl('DNS', 'Samsung Galaxy S24 Ultra 256GB') },
      { shop: 'DNS', variant: '512GB', price: 111999, url: searchUrl('DNS', 'Samsung Galaxy S24 Ultra 512GB') },
      { shop: 'М.Видео', variant: '256GB', price: 95999, url: searchUrl('М.Видео', 'Samsung Galaxy S24 Ultra 256GB') },
      { shop: 'М.Видео', variant: '512GB', price: 110999, url: searchUrl('М.Видео', 'Samsung Galaxy S24 Ultra 512GB') },
      { shop: 'Яндекс.Маркет', variant: '256GB', price: 89990, url: searchUrl('Яндекс.Маркет', 'Samsung Galaxy S24 Ultra 256GB') },
      { shop: 'Яндекс.Маркет', variant: '512GB', price: 104990, url: searchUrl('Яндекс.Маркет', 'Samsung Galaxy S24 Ultra 512GB') },
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
      { shop: 'Ozon', variant: 'Стандарт', price: 32990, url: searchUrl('Ozon', 'Xiaomi Robot Vacuum X20+') },
      { shop: 'Ozon', variant: 'Плюс станция', price: 42990, url: searchUrl('Ozon', 'Xiaomi Robot Vacuum X20+ станция') },
      { shop: 'Wildberries', variant: 'Стандарт', price: 31999, url: searchUrl('Wildberries', 'Xiaomi Robot Vacuum X20') },
      { shop: 'Wildberries', variant: 'Плюс станция', price: 41999, url: searchUrl('Wildberries', 'Xiaomi Robot Vacuum X20+') },
      { shop: 'DNS', variant: 'Стандарт', price: 34999, url: searchUrl('DNS', 'Xiaomi Robot Vacuum X20+') },
      { shop: 'DNS', variant: 'Плюс станция', price: 44999, url: searchUrl('DNS', 'Xiaomi Robot Vacuum X20+') },
      { shop: 'Яндекс.Маркет', variant: 'Стандарт', price: 30990, url: searchUrl('Яндекс.Маркет', 'Xiaomi Robot Vacuum X20') },
      { shop: 'Яндекс.Маркет', variant: 'Плюс станция', price: 40990, url: searchUrl('Яндекс.Маркет', 'Xiaomi Robot Vacuum X20+') },
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
            shop: o.shop, price: o.price, currency: 'RUB', url: o.url, variant: o.variant,
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
