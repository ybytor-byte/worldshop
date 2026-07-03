import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchProvider, SearchOffer, SearchQuery } from '../interfaces/search-provider.interface';

@Injectable()
export class TmapiProvider implements SearchProvider {
  readonly name = 'tmapi';
  readonly supportedRegions = ['ASIA'];
  private readonly apiKey: string;
  private readonly logger = new Logger(TmapiProvider.name);
  private readonly baseUrl = 'https://api.tmapi.top';

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('TMAPI_KEY') || '';
  }

  supportsRegion(region: string): boolean {
    return region.toUpperCase() === 'ASIA';
  }

  async search(query: SearchQuery): Promise<SearchOffer[]> {
    if (!this.apiKey) {
      this.logger.warn('TMAPI key not configured');
      return this.fallbackSearch(query);
    }

    const results: SearchOffer[] = [];
    const sources = [
      { name: 'Taobao', endpoint: '/taobao/item_search' },
      { name: '1688', endpoint: '/1688/item_search' },
    ];

    for (const source of sources) {
      try {
        const offers = await this.searchSource(source.name, source.endpoint, query);
        results.push(...offers);
      } catch (error) {
        this.logger.warn(`${source.name} search failed: ${(error as Error).message}`);
      }
    }

    return results.length > 0 ? results : this.fallbackSearch(query);
  }

  private async searchSource(name: string, endpoint: string, query: SearchQuery): Promise<SearchOffer[]> {
    const url = new URL(endpoint, this.baseUrl);
    url.searchParams.set('q', query.text);
    url.searchParams.set('page', '1');
    url.searchParams.set('page_size', String(query.limit || 10));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      this.logger.warn(`TMAPI ${name} returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return this.parseResponse(data, name);
  }

  private parseResponse(data: any, sourceName: string): SearchOffer[] {
    const items = data.items || data.data || data.result || [];
    if (!Array.isArray(items)) return [];

    return items.slice(0, 10).map((item: any) => ({
      shop: sourceName,
      price: parseFloat(item.price || item.item_price || '0'),
      currency: 'CNY',
      url: item.url || item.item_url || `https://www.taobao.com/list/product/${item.item_id || item.num_iid}`,
      region: 'ASIA',
    }));
  }

  private fallbackSearch(_query: SearchQuery): SearchOffer[] {
    return [];
  }
}
