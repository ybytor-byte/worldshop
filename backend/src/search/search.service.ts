import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MeiliSearch from 'meilisearch';
import { SearchProvider, SearchOffer, SearchQuery } from './interfaces/search-provider.interface';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private providers: SearchProvider[] = [];
  private meili: MeiliSearch;

  constructor(private configService: ConfigService) {
    this.meili = new MeiliSearch({
      host: configService.get<string>('MEILISEARCH_URL') || 'http://localhost:7700',
      apiKey: configService.get<string>('MEILISEARCH_API_KEY') || 'masterKey',
    });
  }

  async onModuleInit() {
    try {
      const { YandexMarketProvider } = await import('./providers/yandex.provider');
      this.providers.push(new YandexMarketProvider(this.configService));
    } catch { this.logger.warn('YandexMarketProvider not available'); }

    try {
      const { SerperProvider } = await import('./providers/serper.provider');
      this.providers.push(new SerperProvider(this.configService));
    } catch { this.logger.warn('SerperProvider not available'); }

    this.logger.log(`Search providers: ${this.providers.map(p => p.name).join(', ')}`);
  }

  registerProvider(provider: SearchProvider) {
    this.providers.push(provider);
  }

  async findMatch(brand: string, model: string): Promise<{ id: string; brand: string; model: string } | null> {
    try {
      const index = this.meili.index('products');
      const result = await index.search(`${brand} ${model}`, {
        limit: 5,
        attributesToRetrieve: ['id', 'brand', 'model'],
      });
      for (const hit of result.hits as Array<{ id: string; brand: string; model: string }>) {
        if (this.normalize(hit.brand) === this.normalize(brand) && this.normalize(hit.model) === this.normalize(model)) {
          return hit;
        }
      }
    } catch { this.logger.warn('Meilisearch unavailable'); }
    return null;
  }

  async indexProduct(data: { id: string; brand: string; model: string; specs: string }) {
    try {
      const index = this.meili.index('products');
      await index.addDocuments([{
        id: data.id,
        brand_normalized: this.normalize(data.brand),
        model_normalized: this.normalize(data.model),
        specs_keywords: data.specs,
      }]);
    } catch { this.logger.warn('Failed to index product'); }
  }

  async searchProducts(query: SearchQuery): Promise<SearchOffer[]> {
    const relevant = this.providers.filter(p => p.supportsRegion(query.region));
    if (relevant.length === 0) return [];

    const results = await Promise.all(
      relevant.map(p => p.search(query).catch(() => [] as SearchOffer[])),
    );

    return results.flat();
  }

  async searchAllRegions(query: string): Promise<Record<string, SearchOffer[]>> {
    const regions = ['RU', 'US', 'EU', 'ASIA'];
    const results: Record<string, SearchOffer[]> = {};
    await Promise.all(regions.map(async (r) => { results[r] = await this.searchProducts({ text: query, region: r }); }));
    return results;
  }

  private normalize(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9а-я]/g, '').trim();
  }
}
