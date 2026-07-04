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
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`SearchApi.io returned ${response.status}: ${errorText}`);
        return this.fallbackSearch(query);
      }

      const data = await response.json();
      return this.parseShoppingResults(data, query.region.toUpperCase(), query.text);
    } catch (error) {
      this.logger.warn(`SearchApi.io request failed: ${(error as Error).message}`);
      return this.fallbackSearch(query);
    }
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
      const link = item.link || item.product_link || '';

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
