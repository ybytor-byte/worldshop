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

  private getStoreUrl(seller: string, productTitle: string, region: string): string {
    const s = seller.toLowerCase();
    const q = encodeURIComponent(productTitle);

    if (s.includes('ozon')) return `https://www.ozon.ru/search?text=${q}`;
    if (s.includes('wildberries')) return `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}`;
    if (s.includes('yandex')) return `https://market.yandex.ru/search?text=${q}`;
    if (s.includes('best buy') || s === 'bestbuy') return `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`;
    if (s.includes('walmart')) return `https://www.walmart.com/search?q=${q}`;
    if (s.includes('amazon')) return region === 'EU' || region === 'DE'
      ? `https://www.amazon.de/s?k=${q}` : `https://www.amazon.com/s?k=${q}`;
    if (s.includes('aliexpress')) return `https://aliexpress.ru/wholesale?SearchText=${q}`;
    if (s.includes('ebay')) return `https://www.ebay.com/sch/i.html?_nkw=${q}`;
    if (s.includes('apple store') || s === 'apple') return `https://www.apple.com/shop/search?q=${q}`;
    if (s.includes('mediamarkt') || s.includes('media markt')) return `https://www.mediamarkt.de/search?query=${q}`;
    if (s.includes('zalando')) return `https://www.zalando.de/search?q=${q}`;
    if (s.includes('target')) return `https://www.target.com/s?searchTerm=${q}`;
    if (s.includes('costco')) return `https://www.costco.com/search?q=${q}`;
    if (s.includes('newegg')) return `https://www.newegg.com/p/pl?d=${q}`;
    if (s.includes('home depot')) return `https://www.homedepot.com/s/${q.replace(/%20/g, '+')}`;
    if (s.includes('lowes')) return `https://www.lowes.com/search?searchTerm=${q}`;
    if (s.includes('b&h') || s.includes('bhphoto')) return `https://www.bhphotovideo.com/c/search?q=${q}`;
    if (s.includes('kns') || s.includes('kns distribution')) return `https://www.knsdistribution.com/search?q=${q}`;
    if (s.includes('swappie')) return `https://www.swappie.com/search?q=${q}`;
    if (s.includes('back market')) return `https://www.backmarket.com/search?q=${q}`;
    if (s.includes('asgoodasnew') || s.includes('as good as new')) return `https://www.asgoodasnew.com/search?q=${q}`;
    if (s.includes('store77')) return `https://store77.net/search?q=${q}`;
    if (s.includes('apple-com')) return `https://apple-com.ru/search?q=${q}`;
    if (s.includes('5element')) return `https://5element.by/search?q=${q}`;
    if (s.includes('yourfone')) return `https://www.yourfone.de/search?q=${q}`;
    if (s.includes('mts') || s.includes('мегафон') || s.includes('билайн')) return `https://www.google.com/search?q=${q}&tbm=shop&gl=${region === 'RU' ? 'ru' : 'us'}`;

    return `https://www.google.com/search?q=${q}&tbm=shop&gl=${region === 'RU' ? 'ru' : region === 'EU' ? 'de' : region === 'ASIA' ? 'jp' : 'us'}`;
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
      const productTitle = item.title || queryText || '';

      const link = item.link || this.getStoreUrl(shop, productTitle, region);

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
