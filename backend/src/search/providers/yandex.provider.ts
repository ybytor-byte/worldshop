import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchProvider, SearchOffer, SearchQuery } from '../interfaces/search-provider.interface';

@Injectable()
export class YandexMarketProvider implements SearchProvider {
  readonly name = 'yandex-market';
  readonly supportedRegions = ['RU'];
  private readonly apiKey: string;
  private readonly logger = new Logger(YandexMarketProvider.name);

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('YANDEX_API_KEY') || '';
  }

  supportsRegion(region: string): boolean {
    return this.supportedRegions.includes(region.toUpperCase());
  }

  async search(query: SearchQuery): Promise<SearchOffer[]> {
    if (!this.apiKey) {
      this.logger.warn('Yandex Search API key not configured');
      return this.fallbackSearch(query.text);
    }

    try {
      return this.fallbackSearch(query.text);
    } catch (error) {
      this.logger.warn(`Yandex Search failed: ${(error as Error).message}`);
      return this.fallbackSearch(query.text);
    }
  }

  private fallbackSearch(_query: string): SearchOffer[] {
    return [];
  }
}
