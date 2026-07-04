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

    const q = config.site ? `${query.text} (${config.site})` : query.text;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': SERPER_KEY },
        body: JSON.stringify({ q, gl: config.gl }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return [];

      const data = await response.json();
      return this.parseResults(data, query.region.toUpperCase());
    } catch {
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

      results.push({
        shop: 'DNS',
        price: 0,
        currency,
        url: link,
        region,
      });
    }

    return results;
  }
}
