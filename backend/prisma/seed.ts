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
      { shop: 'Ozon', variant: '256GB', price: 112990, url: 'https://www.ozon.ru/product/1551432951/' },
      { shop: 'Ozon', variant: '512GB', price: 134990, url: 'https://www.ozon.ru/product/1551432965/' },
      { shop: 'Ozon', variant: '1TB', price: 159990, url: 'https://www.ozon.ru/product/1551432979/' },
      { shop: 'Wildberries', variant: '256GB', price: 109999, url: 'https://www.wildberries.ru/catalog/192231151/detail.aspx' },
      { shop: 'Wildberries', variant: '512GB', price: 131999, url: 'https://www.wildberries.ru/catalog/192231155/detail.aspx' },
      { shop: 'Wildberries', variant: '1TB', price: 157999, url: 'https://www.wildberries.ru/catalog/192231159/detail.aspx' },
      { shop: 'DNS', variant: '256GB', price: 115999, url: 'https://www.dns-shop.ru/product/8d5e3e0c4a4e2b77/' },
      { shop: 'DNS', variant: '512GB', price: 137999, url: 'https://www.dns-shop.ru/product/8d5e3e0c4a4e2b78/' },
      { shop: 'DNS', variant: '1TB', price: 162999, url: 'https://www.dns-shop.ru/product/8d5e3e0c4a4e2b79/' },
      { shop: 'М.Видео', variant: '256GB', price: 113999, url: 'https://www.mvideo.ru/products/smartfon-apple-iphone-15-pro-max-256gb-30137211' },
      { shop: 'М.Видео', variant: '512GB', price: 135999, url: 'https://www.mvideo.ru/products/smartfon-apple-iphone-15-pro-max-512gb-30137212' },
      { shop: 'М.Видео', variant: '1TB', price: 161999, url: 'https://www.mvideo.ru/products/smartfon-apple-iphone-15-pro-max-1tb-30137213' },
      { shop: 'Яндекс.Маркет', variant: '256GB', price: 107990, url: 'https://market.yandex.ru/product--iphone-15-pro-max-256gb/1806278001' },
      { shop: 'Яндекс.Маркет', variant: '512GB', price: 129990, url: 'https://market.yandex.ru/product--iphone-15-pro-max-512gb/1806278002' },
      { shop: 'Яндекс.Маркет', variant: '1TB', price: 155990, url: 'https://market.yandex.ru/product--iphone-15-pro-max-1tb/1806278003' },
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
      { shop: 'Ozon', variant: 'Стандарт', price: 59990, url: 'https://www.ozon.ru/product/394825711/' },
      { shop: 'Ozon', variant: 'Премиум', price: 69990, url: 'https://www.ozon.ru/product/394825712/' },
      { shop: 'Wildberries', variant: 'Стандарт', price: 57999, url: 'https://www.wildberries.ru/catalog/15123456/detail.aspx' },
      { shop: 'Wildberries', variant: 'Премиум', price: 67999, url: 'https://www.wildberries.ru/catalog/15123457/detail.aspx' },
      { shop: 'М.Видео', variant: 'Стандарт', price: 61999, url: 'https://www.mvideo.ru/products/stailer-dyson-airwrap-complete-long-30051234' },
      { shop: 'М.Видео', variant: 'Премиум', price: 71999, url: 'https://www.mvideo.ru/products/stailer-dyson-airwrap-complete-long-premium-30051235' },
      { shop: 'Яндекс.Маркет', variant: 'Стандарт', price: 55990, url: 'https://market.yandex.ru/product--dyson-airwrap-complete-long/1736254001' },
      { shop: 'Яндекс.Маркет', variant: 'Премиум', price: 65990, url: 'https://market.yandex.ru/product--dyson-airwrap-premium/1736254002' },
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
      { shop: 'Ozon', variant: 'Чёрные', price: 27990, url: 'https://www.ozon.ru/product/526384526/' },
      { shop: 'Ozon', variant: 'Серебристые', price: 27990, url: 'https://www.ozon.ru/product/526384527/' },
      { shop: 'Ozon', variant: 'Midnight Blue', price: 28990, url: 'https://www.ozon.ru/product/526384528/' },
      { shop: 'Wildberries', variant: 'Чёрные', price: 26999, url: 'https://www.wildberries.ru/catalog/12345678/detail.aspx' },
      { shop: 'Wildberries', variant: 'Серебристые', price: 26999, url: 'https://www.wildberries.ru/catalog/12345679/detail.aspx' },
      { shop: 'DNS', variant: 'Чёрные', price: 28999, url: 'https://www.dns-shop.ru/product/8a1b2c3d4e5f/' },
      { shop: 'DNS', variant: 'Серебристые', price: 28999, url: 'https://www.dns-shop.ru/product/8a1b2c3d4e5g/' },
      { shop: 'М.Видео', variant: 'Чёрные', price: 29999, url: 'https://www.mvideo.ru/products/naushniki-sony-wh-1000xm5-black-30012345' },
      { shop: 'М.Видео', variant: 'Серебристые', price: 29999, url: 'https://www.mvideo.ru/products/naushniki-sony-wh-1000xm5-silver-30012346' },
      { shop: 'Яндекс.Маркет', variant: 'Чёрные', price: 25990, url: 'https://market.yandex.ru/product--sony-wh-1000xm5-black/1725254001' },
      { shop: 'Яндекс.Маркет', variant: 'Серебристые', price: 25990, url: 'https://market.yandex.ru/product--sony-wh-1000xm5-silver/1725254002' },
      { shop: 'Яндекс.Маркет', variant: 'Midnight Blue', price: 26990, url: 'https://market.yandex.ru/product--sony-wh-1000xm5-midnight-blue/1725254003' },
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
      { shop: 'Яндекс.Маркет', variant: 'Small (25см)', price: 789000, url: 'https://market.yandex.ru/search?text=Chanel+Classic+Double+Flap+Bag' },
      { shop: 'Яндекс.Маркет', variant: 'Medium (30см)', price: 899000, url: 'https://market.yandex.ru/search?text=Chanel+Classic+Double+Flap+Bag+30' },
      { shop: 'Ozon', variant: 'Small (25см)', price: 825000, url: 'https://www.ozon.ru/search/?text=Chanel+Classic+Double+Flap+25' },
      { shop: 'Ozon', variant: 'Medium (30см)', price: 945000, url: 'https://www.ozon.ru/search/?text=Chanel+Classic+Double+Flap+30' },
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
      { shop: 'Ozon', variant: '256GB', price: 94990, url: 'https://www.ozon.ru/product/1551432980/' },
      { shop: 'Ozon', variant: '512GB', price: 109990, url: 'https://www.ozon.ru/product/1551432981/' },
      { shop: 'Ozon', variant: '1TB', price: 134990, url: 'https://www.ozon.ru/product/1551432982/' },
      { shop: 'Wildberries', variant: '256GB', price: 92999, url: 'https://www.wildberries.ru/catalog/192231160/detail.aspx' },
      { shop: 'Wildberries', variant: '512GB', price: 107999, url: 'https://www.wildberries.ru/catalog/192231161/detail.aspx' },
      { shop: 'Wildberries', variant: '1TB', price: 132999, url: 'https://www.wildberries.ru/catalog/192231162/detail.aspx' },
      { shop: 'DNS', variant: '256GB', price: 96999, url: 'https://www.dns-shop.ru/product/9e5f3e0c4a4e2c99/' },
      { shop: 'DNS', variant: '512GB', price: 111999, url: 'https://www.dns-shop.ru/product/9e5f3e0c4a4e2c98/' },
      { shop: 'М.Видео', variant: '256GB', price: 95999, url: 'https://www.mvideo.ru/products/smartfon-samsung-galaxy-s24-ultra-256gb-30137221' },
      { shop: 'М.Видео', variant: '512GB', price: 110999, url: 'https://www.mvideo.ru/products/smartfon-samsung-galaxy-s24-ultra-512gb-30137222' },
      { shop: 'Яндекс.Маркет', variant: '256GB', price: 89990, url: 'https://market.yandex.ru/product--samsung-galaxy-s24-ultra-256gb/1806279001' },
      { shop: 'Яндекс.Маркет', variant: '512GB', price: 104990, url: 'https://market.yandex.ru/product--samsung-galaxy-s24-ultra-512gb/1806279002' },
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
      { shop: 'Ozon', variant: 'Стандарт', price: 32990, url: 'https://www.ozon.ru/product/627384910/' },
      { shop: 'Ozon', variant: 'Плюс станция', price: 42990, url: 'https://www.ozon.ru/product/627384911/' },
      { shop: 'Wildberries', variant: 'Стандарт', price: 31999, url: 'https://www.wildberries.ru/catalog/17123456/detail.aspx' },
      { shop: 'Wildberries', variant: 'Плюс станция', price: 41999, url: 'https://www.wildberries.ru/catalog/17123457/detail.aspx' },
      { shop: 'DNS', variant: 'Стандарт', price: 34999, url: 'https://www.dns-shop.ru/product/7b2c3d4e5f6a/' },
      { shop: 'DNS', variant: 'Плюс станция', price: 44999, url: 'https://www.dns-shop.ru/product/7b2c3d4e5f6b/' },
      { shop: 'Яндекс.Маркет', variant: 'Стандарт', price: 30990, url: 'https://market.yandex.ru/product--xiaomi-robot-vacuum-x20/1738255001' },
      { shop: 'Яндекс.Маркет', variant: 'Плюс станция', price: 40990, url: 'https://market.yandex.ru/product--xiaomi-robot-vacuum-x20-plus/1738255002' },
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
      console.log(`  Replacing ${item.brand} ${item.model}`);
      await prisma.offer.deleteMany({ where: { productId: existing.id } });
      await prisma.product.delete({ where: { id: existing.id } });
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
            variant: o.variant,
          })),
        },
      },
    });

    console.log(`  Created ${item.brand} ${item.model} with ${item.offers.length} offers`);
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
