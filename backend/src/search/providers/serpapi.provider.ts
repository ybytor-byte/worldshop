import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchProvider, SearchOffer, SearchQuery } from '../interfaces/search-provider.interface';

interface SerpApiParams {
  engine: string;
  q: string;
  api_key: string;
  gl?: string;
  hl?: string;
  [key: string]: any;
}

@Injectable()
export class SerpApiProvider implements SearchProvider {
  readonly name = 'serpapi';
  readonly supportedRegions = ['RU', 'US', 'EU', 'ASIA'];
  private readonly apiKey: string;
  private readonly logger = new Logger(SerpApiProvider.name);
  private readonly baseUrl = 'https://serpapi.com/search';

  private readonly regionConfig: Record<string, { engine: string; gl: string; domain: string }> = {
    RU: { engine: 'google_shopping', gl: 'ru', domain: 'google.ru' },
    US: { engine: 'google_shopping', gl: 'us', domain: 'google.com' },
    EU: { engine: 'google_shopping', gl: 'de', domain: 'google.de' },
    ASIA: { engine: 'aliexpress', gl: '', domain: '' },
  };

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('SERPAPI_KEY') || 'bwetm5ZbkwqYuBw7eJHTozrU';
  }

  supportsRegion(region: string): boolean {
    return this.supportedRegions.includes(region.toUpperCase());
  }

  async search(query: SearchQuery): Promise<SearchOffer[]> {
    if (!this.apiKey) {
      this.logger.warn('SerpAPI key not configured, using fallback links');
      return this.fallbackSearch(query);
    }

    const config = this.regionConfig[query.region.toUpperCase()];
    if (!config) return [];

    try {
      const params: SerpApiParams = {
        engine: config.engine,
        q: query.text,
        api_key: this.apiKey,
      };

      if (config.gl) params.gl = config.gl;
      if (config.domain) params.google_domain = config.domain;

      const url = `${this.baseUrl}?${new URLSearchParams(params as any).toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(`SerpAPI returned ${response.status}`);
        return this.fallbackSearch(query);
      }

      const data = await response.json();
      return this.parseResponse(data, query.region.toUpperCase());
    } catch (error) {
      this.logger.warn(`SerpAPI request failed: ${(error as Error).message}`);
      return this.fallbackSearch(query);
    }
  }

  private parseResponse(data: any, region: string): SearchOffer[] {
    const results: SearchOffer[] = [];
    const items = data.shopping_results || data.organic_results || [];

    for (const item of items.slice(0, 10)) {
      results.push({
        shop: item.source || item.store || 'Store',
        price: parseFloat(item.price?.replace(/[^0-9.,]/g, '')?.replace(',', '.')) || 0,
        currency: item.currency || (region === 'EU' ? 'EUR' : region === 'ASIA' ? 'USD' : 'USD'),
        url: item.link || item.product_link || '',
        region,
        shipping: item.shipping ? parseFloat(item.shipping.replace(/[^0-9.]/g, '')) : undefined,
      });
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
        { shop: 'Best Buy', price: 0, currency: 'USD', url: `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`, region: 'US' },
      ],
      EU: [
        { shop: 'MediaMarkt', price: 0, currency: 'EUR', url: `https://www.mediamarkt.de/search?query=${q}`, region: 'EU' },
        { shop: 'Amazon DE', price: 0, currency: 'EUR', url: `https://www.amazon.de/s?k=${q}`, region: 'EU' },
        { shop: 'Saturn', price: 0, currency: 'EUR', url: `https://www.saturn.de/search?query=${q}`, region: 'EU' },
      ],
      ASIA: [
        { shop: 'AliExpress', price: 0, currency: 'USD', url: `https://aliexpress.ru/wholesale?SearchText=${q}`, region: 'ASIA' },
        { shop: 'Shopee', price: 0, currency: 'USD', url: `https://shopee.sg/search?keyword=${q}`, region: 'ASIA' },
      ],
    };

    return fallbackUrls[region] || [];
  }
}
