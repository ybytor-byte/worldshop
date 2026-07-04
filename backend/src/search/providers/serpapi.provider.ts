import { Injectable, Logger } from '@nestjs/common';
import { SearchProvider, SearchOffer, SearchQuery } from '../interfaces/search-provider.interface';

const API_KEY = 'bwetm5ZbkwqYuBw7eJHTozrU';
const SEARCHAPI_URL = 'https://www.searchapi.io/api/v1/search';
const SERPER_URL = 'https://google.serper.dev/search';
const SERPER_KEY = '9000c5387a242c037905ad2b7b05bb5156d2d3e3';

@Injectable()
export class SerpApiProvider implements SearchProvider {
  readonly name = 'serpapi';
  readonly supportedRegions = ['RU', 'US', 'EU', 'ASIA'];
  private readonly logger = new Logger(SerpApiProvider.name);

  private readonly regionConfig: Record<string, { gl: string; currency: string; site: string }> = {
    RU: { gl: 'ru', currency: 'RUB', site: '(site:dns-shop.ru/product/ OR site:ozon.ru/product/ OR site:regard.ru/product/)' },
    US: { gl: 'us', currency: 'USD', site: '(site:amazon.com OR site:bestbuy.com)' },
    EU: { gl: 'de', currency: 'EUR', site: '(site:amazon.de/dp/ OR site:mediamarkt.de/de/product/)' },
    ASIA: { gl: 'jp', currency: 'JPY', site: '(site:amazon.co.jp/dp/)' },
  };

  supportsRegion(region: string): boolean {
    return this.supportedRegions.includes(region.toUpperCase());
  }

  async search(query: SearchQuery): Promise<SearchOffer[]> {
    const config = this.regionConfig[query.region.toUpperCase()];
    if (!config) return [];

    let cleanText = query.text
      .replace(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}:\s*/, '')
      .replace(/["']/g, '')
      .trim();

    const q = `"${cleanText}" ${config.site} -inurl:search -inurl:category`;

    // Try serper first, fall back to searchapi
    const results = await this.trySerper(q, config.gl, query.region.toUpperCase());
    if (results.length > 0) return results;

    this.logger.log('Serper failed, trying SearchApi.io organic');
    return this.trySearchApi(q, config.gl, query.region.toUpperCase());
  }

  private async trySerper(q: string, gl: string, region: string): Promise<SearchOffer[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(SERPER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': SERPER_KEY },
        body: JSON.stringify({ q, gl, hl: 'ru', autocorrect: false, verbatim: true }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return [];

      const data = await response.json();
      return this.parseResults(data, region);
    } catch {
      return [];
    }
  }

  private async trySearchApi(q: string, gl: string, region: string): Promise<SearchOffer[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const url = `${SEARCHAPI_URL}?engine=google&q=${encodeURIComponent(q)}&gl=${gl}&hl=ru&api_key=${API_KEY}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) return [];

      const data = await response.json();
      return this.parseResults(data, region);
    } catch (err) {
      this.logger.warn(`SearchApi organic failed: ${(err as Error).message}`);
      return [];
    }
  }

  private parseResults(data: any, region: string): SearchOffer[] {
    const organic = data.organic || data.organic_results || [];
    const results: SearchOffer[] = [];

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
        else if (hostname.includes('amazon')) shopName = 'Amazon';
        else shopName = hostname;
      } catch {}

      results.push({
        shop: shopName,
        price: this.extractPrice(item.snippet || ''),
        currency: this.regionConfig[region]?.currency || 'USD',
        url: link,
        region,
      });
    }

    return results.slice(0, 10);
  }

  private extractPrice(snippet: string): number {
    const match = snippet.match(/(\d[\d\s]*)\s*(?:руб|₽|рублей|\$|€|¥)/);
    if (match) return parseInt(match[1].replace(/\s/g, ''), 10);
    return 0;
  }
}
