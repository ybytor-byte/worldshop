import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedData = [
  {
    brand: 'Apple',
    model: 'iPhone 15 Pro Max 256GB',
    specs: { display: '6.7" OLED', chip: 'A17 Pro', ram: '8GB', storage: '256GB', battery: '4422mAh' },
    offers: [
      { shop: 'Ozon', price: 112990, url: 'https://www.ozon.ru/search/?text=iPhone+15+Pro+Max+256GB' },
      { shop: 'Wildberries', price: 109999, url: 'https://www.wildberries.ru/catalog/0/search.aspx?search=iPhone+15+Pro+Max' },
      { shop: 'DNS', price: 115999, url: 'https://www.dns-shop.ru/search/?q=iPhone+15+Pro+Max' },
      { shop: 'М.Видео', price: 113999, url: 'https://www.mvideo.ru/product-list-page?q=iPhone+15+Pro+Max' },
      { shop: 'Яндекс.Маркет', price: 107990, url: 'https://market.yandex.ru/search?text=iPhone+15+Pro+Max' },
    ],
  },
  {
    brand: 'Dyson',
    model: 'Airwrap Complete Long',
    specs: { type: 'Стайлер', attachments: '6 насадок', power: '1300W', heat: '3 режима', warranty: '2 года' },
    offers: [
      { shop: 'Ozon', price: 59990, url: 'https://www.ozon.ru/search/?text=Dyson+Airwrap+Complete+Long' },
      { shop: 'Wildberries', price: 57999, url: 'https://www.wildberries.ru/catalog/0/search.aspx?search=Dyson+Airwrap' },
      { shop: 'М.Видео', price: 61999, url: 'https://www.mvideo.ru/product-list-page?q=Dyson+Airwrap' },
      { shop: 'Яндекс.Маркет', price: 55990, url: 'https://market.yandex.ru/search?text=Dyson+Airwrap' },
    ],
  },
  {
    brand: 'Sony',
    model: 'WH-1000XM5',
    specs: { type: 'Беспроводные наушники', noise_cancel: 'Активное', battery: '30 часов', codec: 'LDAC', weight: '250g' },
    offers: [
      { shop: 'Ozon', price: 27990, url: 'https://www.ozon.ru/search/?text=Sony+WH-1000XM5' },
      { shop: 'Wildberries', price: 26999, url: 'https://www.wildberries.ru/catalog/0/search.aspx?search=Sony+WH-1000XM5' },
      { shop: 'DNS', price: 28999, url: 'https://www.dns-shop.ru/search/?q=Sony+WH-1000XM5' },
      { shop: 'М.Видео', price: 29999, url: 'https://www.mvideo.ru/product-list-page?q=Sony+WH-1000XM5' },
      { shop: 'Яндекс.Маркет', price: 25990, url: 'https://market.yandex.ru/search?text=Sony+WH-1000XM5' },
    ],
  },
  {
    brand: 'Chanel',
    model: 'Classic Double Flap Bag',
    specs: { material: 'Кожа ягнёнка', color: 'Чёрный', hardware: 'Золото', size: '25см', origin: 'Франция' },
    offers: [
      { shop: 'Яндекс.Маркет', price: 789000, url: 'https://market.yandex.ru/search?text=Chanel+Classic+Double+Flap+Bag' },
      { shop: 'Ozon', price: 825000, url: 'https://www.ozon.ru/search/?text=Chanel+Classic+Double+Flap' },
    ],
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra 512GB',
    specs: { display: '6.8" Dynamic AMOLED', chip: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '512GB', battery: '5000mAh' },
    offers: [
      { shop: 'Ozon', price: 94990, url: 'https://www.ozon.ru/search/?text=Samsung+Galaxy+S24+Ultra' },
      { shop: 'Wildberries', price: 92999, url: 'https://www.wildberries.ru/catalog/0/search.aspx?search=Samsung+Galaxy+S24+Ultra' },
      { shop: 'DNS', price: 96999, url: 'https://www.dns-shop.ru/search/?q=Samsung+Galaxy+S24+Ultra' },
      { shop: 'М.Видео', price: 95999, url: 'https://www.mvideo.ru/product-list-page?q=Samsung+Galaxy+S24+Ultra' },
    ],
  },
  {
    brand: 'Xiaomi',
    model: 'Robot Vacuum X20+',
    specs: { type: 'Робот-пылесос', suction: '6000Pa', battery: '5200mAh', navigation: 'LDS+LiDAR', mopping: 'Есть' },
    offers: [
      { shop: 'Ozon', price: 32990, url: 'https://www.ozon.ru/search/?text=Xiaomi+Robot+Vacuum+X20' },
      { shop: 'Wildberries', price: 31999, url: 'https://www.wildberries.ru/catalog/0/search.aspx?search=Xiaomi+Robot+Vacuum+X20' },
      { shop: 'DNS', price: 34999, url: 'https://www.dns-shop.ru/search/?q=Xiaomi+Robot+Vacuum+X20' },
      { shop: 'Яндекс.Маркет', price: 30990, url: 'https://market.yandex.ru/search?text=Xiaomi+Robot+Vacuum+X20' },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  for (const item of seedData) {
    const existing = await prisma.product.findFirst({
      where: { brand: item.brand, model: item.model },
    });

    if (existing) {
      console.log(`  Skipping ${item.brand} ${item.model} — already exists`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        brand: item.brand,
        model: item.model,
        specs: item.specs as any,
        offers: {
          create: item.offers.map((o) => ({
            shop: o.shop,
            price: o.price,
            currency: 'RUB',
            url: o.url,
          })),
        },
      },
    });

    console.log(`  Created ${item.brand} ${item.model} (${product.id})`);
  }

  const counts = await Promise.all([
    prisma.product.count(),
    prisma.offer.count(),
  ]);

  console.log(`\nDone! ${counts[0]} products, ${counts[1]} offers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
