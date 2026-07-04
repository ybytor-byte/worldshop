const SERPER_KEY = '9000c5387a242c037905ad2b7b05bb5156d2d3e3';
const BASE_URL = 'https://google.serper.dev/search';

const regionConfig = {
  RU: { gl: 'ru', currency: 'RUB', site: '(site:dns-shop.ru/product/ OR site:ozon.ru/product/ OR site:regard.ru/product/)' },
  US: { gl: 'us', currency: 'USD', site: '(site:bestbuy.com)' },
  EU: { gl: 'de', currency: 'EUR', site: '(site:mediamarkt.de/de/product/)' },
  ASIA: { gl: 'jp', currency: 'JPY', site: '' },
};

function extractPrice(snippet: string): number {
  const match = snippet.match(/(\d[\d\s]*)\s*(?:руб|₽|рублей|\$|€|¥)/);
  if (match) return parseInt(match[1].replace(/\s/g, ''), 10);
  return 0;
}

function parseResults(data: any, region: string) {
  const organic = data.organic || [];
  const results: any[] = [];

  for (const item of organic) {
    const link = item.link || '';
    if (!link) continue;
    if (link.includes('/search') || link.includes('/category') || link.includes('?text=')) continue;

    let shopName = 'Store';
    try {
      const hostname = new URL(link).hostname.replace('www.', '');
      if (hostname.includes('dns-shop.ru')) shopName = 'DNS';
      else if (hostname.includes('ozon.ru')) shopName = 'Ozon';
      else if (hostname.includes('regard.ru')) shopName = 'Regard';
      else shopName = hostname;
    } catch {}

    results.push({
      shop: shopName,
      price: extractPrice(item.snippet || ''),
      currency: regionConfig[region]?.currency || 'USD',
      url: link,
      region,
    });
  }

  return results.slice(0, 10);
}

async function test(queryText: string, region: string) {
  const config = regionConfig[region];
  if (!config) { console.log('Unknown region'); return; }

  let cleanText = queryText
    .replace(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}:\s*/, '')
    .replace(/["']/g, '')
    .trim();

  const q = `"${cleanText}" ${config.site} -inurl:search -inurl:category`;

  console.log(`\n=== ${region} ===`);
  console.log(`Query: ${q}`);

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': SERPER_KEY },
      body: JSON.stringify({ q, gl: config.gl, hl: 'ru', autocorrect: false, verbatim: true }),
    });

    if (!response.ok) {
      console.log(`HTTP ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log(`Credits: ${data.credits}`);
    const results = parseResults(data, region);
    console.log(`Results: ${results.length}`);

    for (const r of results) {
      console.log(`  [${r.shop}] ${r.url}`);
    }
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}

async function main() {
  await test('Apple iPhone 15 Pro 256GB Natural Titanium', 'RU');
  await test('Samsung Galaxy S25 Ultra 512GB', 'US');
  await test('Sony WH-1000XM5', 'EU');
  await test('Nintendo Switch 2', 'ASIA');
}

main();
