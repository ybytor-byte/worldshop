import { Injectable, Logger } from '@nestjs/common';
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
        engine: 'google',
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
      return this.parseResults(data, query.region.toUpperCase(), query.text);
    } catch (error) {
      this.logger.warn(`SearchApi.io request failed: ${(error as Error).message}`);
      return this.fallbackSearch(query);
    }
  }

  private parseResults(data: any, region: string, queryText?: string): SearchOffer[] {
    const results: SearchOffer[] = [];
    const seen = new Set<string>();
    const currency = this.regionConfig[region]?.currency || 'USD';

    const organicItems = data.organic_results || [];

    for (const item of organicItems.slice(0, 15)) {
      const link = item.link || '';
      const shop = item.source || item.domain || 'Store';
      const price = this.extractPrice(item, region);

      const key = `${shop}|${price}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({ shop, price, currency, url: link, region });
    }

    this.logger.log(`SearchApi.io organic: ${organicItems.length} items, ${results.length} with links`);

    return results;
  }

  private extractPrice(item: any, region: string): number {
    if (typeof item.extracted_price === 'number' && item.extracted_price > 0) {
      return item.extracted_price;
    }

    const extensions = item.rich_snippet?.extensions;
    if (Array.isArray(extensions) && extensions.length > 0) {
      for (const ext of extensions) {
        if (typeof ext !== 'string') continue;
        const nums = ext.match(/[\d\s]+[\d]/g);
        if (nums) {
          const parsed = parseFloat(nums[0].replace(/\s/g, '').replace(/,/g, '.'));
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      }
    }

    const snippet = item.snippet || '';
    const snippetNums = snippet.match(/[\d]{2,}[\s\d]*\s*(?:руб|₽|\$|€|¥|USD|EUR)/i);
    if (snippetNums) {
      const parsed = parseFloat(snippetNums[0].replace(/\s/g, ''));
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    return 0;
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
