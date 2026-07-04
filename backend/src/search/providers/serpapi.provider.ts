import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchProvider, SearchOffer, SearchQuery } from '../interfaces/search-provider.interface';

const SEARCHAPI_KEY = 'bwetm5ZbkwqYuBw7eJHTozrU';
const BASE_URL = 'https://www.searchapi.io/api/v1/search';

@Injectable()
export class SerpApiProvider implements SearchProvider {
  readonly name = 'serpapi';
  readonly supportedRegions = ['RU', 'US', 'EU', 'ASIA'];
  private readonly apiKey: string;
  private readonly logger = new Logger(SerpApiProvider.name);

  private readonly regionConfig: Record<string, { gl: string; hl: string; currency: string }> = {
    RU: { gl: 'ru', hl: 'ru', currency: 'RUB' },
    US: { gl: 'us', hl: 'en', currency: 'USD' },
    EU: { gl: 'de', hl: 'de', currency: 'EUR' },
    ASIA: { gl: 'jp', hl: 'ja', currency: 'JPY' },
  };

  constructor() {
    this.apiKey = SEARCHAPI_KEY;
  }

  supportsRegion(region: string): boolean {
    return this.supportedRegions.includes(region.toUpperCase());
  }

  async search(query: SearchQuery): Promise<SearchOffer[]> {
    if (!this.apiKey) return [];

    const config = this.regionConfig[query.region.toUpperCase()];
    if (!config) return [];

    try {
      const params = new URLSearchParams({
        engine: 'google_shopping',
        q: query.text,
        api_key: this.apiKey,
        gl: config.gl,
        hl: config.hl,
      });

      const url = `${BASE_URL}?${params.toString()}`;
      this.logger.log(`SearchApi.io request: ${url.replace(this.apiKey, '***')}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`SearchApi.io returned ${response.status}: ${errorText}`);
        return this.fallbackSearch(query);
      }

      const data = await response.json();
      return this.parseShoppingResults(data, query.region.toUpperCase(), query.text);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('abort')) {
        this.logger.warn('SearchApi.io request timed out');
      } else {
        this.logger.warn(`SearchApi.io request failed: ${msg}`);
      }
      return this.fallbackSearch(query);
    }
  }

  private readonly storeUrls: Record<string, string> = {
    'dns': 'https://www.dns-shop.ru/search/?q=',
    'ozon': 'https://www.ozon.ru/search?text=',
    'regard': 'https://www.regard.ru/search?q=',
    'citilink': 'https://www.citilink.ru/search/?text=',
    'mvideo': 'https://www.mvideo.ru/search?q=',
    're-store': 'https://re-store.ru/search/?q=',
    'biggeek': 'https://biggeek.ru/catalog?q=',
    'wildberries': 'https://www.wildberries.ru/catalog/0/search.aspx?search=',
    'yandex market': 'https://market.yandex.ru/search?text=',
    'apple': 'https://www.apple.com/shop/search?q=',
    'amazon': 'https://www.amazon.com/s?k=',
    'best buy': 'https://www.bestbuy.com/site/searchpage.jsp?st=',
    'walmart': 'https://www.walmart.com/search?q=',
    'ebay': 'https://www.ebay.com/sch/i.html?_nkw=',
    'mediamarkt': 'https://www.mediamarkt.de/search?query=',
    'aliexpress': 'https://aliexpress.ru/wholesale?SearchText=',
  };

  private resolveUrl(shop: string, link: string, queryText: string): string {
    if (!link || link.includes('google.com/search?ibp=oshop')) {
      const q = encodeURIComponent(queryText.replace(/[^a-zA-Zа-яёА-ЯЁ0-9\s\-]/g, '').trim().slice(0, 120));
      const shopLower = shop.toLowerCase();
      for (const [key, baseUrl] of Object.entries(this.storeUrls)) {
        if (shopLower.includes(key)) return `${baseUrl}${q}`;
      }
    }
    return link || '';
  }

  private parseShoppingResults(data: any, region: string, queryText?: string): SearchOffer[] {
    const results: SearchOffer[] = [];
    const seen = new Set<string>();

    const items = [
      ...(data.shopping_ads || []),
      ...(data.shopping_results || []),
    ];

    this.logger.log(`SearchApi.io got ${items.length} items for ${region}`);

    for (const item of items.slice(0, 20)) {
      const price = typeof item.extracted_price === 'number' ? item.extracted_price : 0;
      if (price <= 0) continue;

      const shop = item.seller || item.source || item.store || 'Store';
      const link = this.resolveUrl(shop, item.link || item.product_link || '', queryText || '');

      const key = `${shop}|${price}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const currency = this.regionConfig[region]?.currency || 'USD';
      results.push({ shop, price, currency, url: link, region });
    }

    return results;
  }

  private fallbackSearch(query: SearchQuery): SearchOffer[] {
    const q = encodeURIComponent(query.text);
    const region = query.region.toUpperCase();

    const fallbackUrls: Record<string, SearchOffer[]> = {
      RU: [
        { shop: 'Ozon', price: 0, currency: 'RUB', url: `https://www.ozon.ru/search?text=${q}`, region: 'RU' },
        { shop: 'Wildberries', price: 0, currency: 'RUB', url: `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}`, region: 'RU' },
        { shop: 'Yandex Market', price: 0, currency: 'RUB', url: `https://market.yandex.ru/search?text=${q}`, region: 'RU' },
      ],
      US: [
        { shop: 'Amazon', price: 0, currency: 'USD', url: `https://www.amazon.com/s?k=${q}`, region: 'US' },
        { shop: 'Walmart', price: 0, currency: 'USD', url: `https://www.walmart.com/search?q=${q}`, region: 'US' },
      ],
      EU: [
        { shop: 'Amazon DE', price: 0, currency: 'EUR', url: `https://www.amazon.de/s?k=${q}`, region: 'EU' },
        { shop: 'MediaMarkt', price: 0, currency: 'EUR', url: `https://www.mediamarkt.de/search?query=${q}`, region: 'EU' },
      ],
      ASIA: [
        { shop: 'AliExpress', price: 0, currency: 'USD', url: `https://aliexpress.ru/wholesale?SearchText=${q}`, region: 'ASIA' },
      ],
    };

    return fallbackUrls[region] || [];
  }
}
