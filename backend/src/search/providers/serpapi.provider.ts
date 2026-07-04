import { Injectable, Logger } from '@nestjs/common';
import { SearchProvider, SearchOffer, SearchQuery } from '../interfaces/search-provider.interface';

const SERPER_KEY = '9000c5387a242c037905ad2b7b05bb5156d2d3e3';
const BASE_URL = 'https://google.serper.dev/search';

@Injectable()
export class SerpApiProvider implements SearchProvider {
  readonly name = 'serpapi';
  readonly supportedRegions = ['RU', 'US', 'EU', 'ASIA'];
  private readonly logger = new Logger(SerpApiProvider.name);

  private readonly regionConfig: Record<string, { gl: string; currency: string; site: string }> = {
    RU: { gl: 'ru', currency: 'RUB', site: 'site:dns-shop.ru/product/' },
    US: { gl: 'us', currency: 'USD', site: '' },
    EU: { gl: 'de', currency: 'EUR', site: '' },
    ASIA: { gl: 'jp', currency: 'JPY', site: '' },
  };

  supportsRegion(region: string): boolean {
    return this.supportedRegions.includes(region.toUpperCase());
  }

  async search(query: SearchQuery): Promise<SearchOffer[]> {
    const config = this.regionConfig[query.region.toUpperCase()];
    if (!config) return [];

    const q = config.site ? `${query.text} ${config.site}` : query.text;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': SERPER_KEY },
        body: JSON.stringify({ q, gl: config.gl }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        this.logger.warn(`Serper returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      this.logger.log(`Serper OK: ${(data.organic||[]).length} results for "${q}"`);
      return this.parseResults(data, query.region.toUpperCase());
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.warn(`Serper failed: ${msg}`);
      return [];
    }
  }

  private parseResults(data: any, region: string): SearchOffer[] {
    const organic = data.organic || [];
    const currency = this.regionConfig[region]?.currency || 'USD';
    const results: SearchOffer[] = [];

    for (const item of organic.slice(0, 10)) {
      const link = item.link || '';
      if (!link) continue;

      const urlLower = link.toLowerCase();
      let shop = 'DNS';
      if (urlLower.includes('re-store.ru')) shop = 'Re-store';
      else if (urlLower.includes('ozon.ru')) shop = 'Ozon';
      else if (urlLower.includes('regard.ru')) shop = 'Regard';
      else if (urlLower.includes('citilink.ru')) shop = 'Citilink';
      else if (urlLower.includes('mvideo.ru')) shop = 'M.Video';
      else if (urlLower.includes('biggeek.ru')) shop = 'BigGeek';
      else if (urlLower.includes('wildberries.ru')) shop = 'Wildberries';
      else if (urlLower.includes('apple.com')) shop = 'Apple';
      else if (urlLower.includes('bestbuy.com')) shop = 'Best Buy';
      else if (urlLower.includes('amazon.com')) shop = 'Amazon';
      else if (urlLower.includes('walmart.com')) shop = 'Walmart';
      else if (urlLower.includes('ebay.com')) shop = 'eBay';
      else if (urlLower.includes('mediamarkt.de')) shop = 'MediaMarkt';

      results.push({ shop, price: 0, currency, url: link, region });
    }

    return results;
  }
}
