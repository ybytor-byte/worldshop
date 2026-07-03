import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchProvider, SearchOffer, SearchQuery } from '../interfaces/search-provider.interface';

@Injectable()
export class SerperProvider implements SearchProvider {
  readonly name = 'serper';
  readonly supportedRegions = ['US', 'EU', 'ASIA', 'RU'];
  private readonly apiKey: string;
  private readonly logger = new Logger(SerperProvider.name);
  private readonly baseUrl = 'https://google.serper.dev/shopping';

  private readonly regionConfig: Record<string, string> = {
    US: 'us', EU: 'de', ASIA: 'jp', RU: 'ru',
  };

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('SERPER_KEY') || '';
  }

  supportsRegion(region: string): boolean {
    return this.supportedRegions.includes(region.toUpperCase());
  }

  async search(query: SearchQuery): Promise<SearchOffer[]> {
    if (!this.apiKey) return [];

    const gl = this.regionConfig[query.region.toUpperCase()];
    if (!gl) return [];

    try {
      const body: Record<string, any> = { q: query.text, gl };
      if (query.limit) body.num = query.limit;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': this.apiKey },
        body: JSON.stringify(body),
      });

      if (!response.ok) return [];

      const data = await response.json();
      return this.parseShoppingResults(data, query.region.toUpperCase());
    } catch {
      return [];
    }
  }

  private parseShoppingResults(data: any, region: string): SearchOffer[] {
    const items = data.shopping;
    if (!items || !Array.isArray(items) || items.length === 0) return [];

    const results: SearchOffer[] = [];

    for (const item of items.slice(0, 15)) {
      // price может быть { amount, currency } | number | string
      const price =
        typeof item.price === 'object' && item.price !== null
          ? (item.price.amount ?? 0)
          : typeof item.price === 'number'
            ? item.price
            : parseFloat(String(item.price ?? '').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

      if (price <= 0) continue;

      const currency =
        typeof item.price === 'object' && item.price !== null
          ? (item.price.currency || this.defaultCurrency(region))
          : this.defaultCurrency(region);

      const shop = item.source || item.store || item.title || 'Store';
      const url = this.pickUrl(item);

      results.push({ shop, price, currency, url, region });
    }

    return results;
  }

  private pickUrl(item: any): string {
    const link = item.link || item.product_link || '';
    if (!link) return '';
    const extracted = this.extractRealUrl(link);
    if (extracted) return extracted;
    return link;
  }

  private defaultCurrency(region: string): string {
    const map: Record<string, string> = { RU: 'RUB', US: 'USD', EU: 'EUR', ASIA: 'JPY' };
    return map[region] || 'USD';
  }

  private extractRealUrl(rawUrl: string): string | null {
    if (!rawUrl) return null;
    if (rawUrl.includes('google.com/url?q=')) {
      try {
        const u = new URL(rawUrl);
        const q = u.searchParams.get('q');
        if (q && (q.startsWith('http://') || q.startsWith('https://'))) return q;
      } catch { /* ignore */ }
    }
    if (rawUrl.includes('google.com')) return null;
    return rawUrl;
  }
}
