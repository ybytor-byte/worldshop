import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MeiliSearch from 'meilisearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;

  constructor(configService: ConfigService) {
    this.client = new MeiliSearch({
      host: configService.get<string>('MEILISEARCH_URL') || 'http://localhost:7700',
      apiKey: configService.get<string>('MEILISEARCH_API_KEY') || 'masterKey',
    });
  }

  async findMatch(brand: string, model: string) {
    try {
      const index = this.client.index('products');
      const result = await index.search(`${brand} ${model}`, {
        limit: 5,
        attributesToRetrieve: ['id', 'brand', 'model'],
      });

      for (const hit of result.hits as Array<{ id: string; brand: string; model: string }>) {
        const brandMatch = this.normalize(hit.brand) === this.normalize(brand);
        const modelMatch = this.normalize(hit.model) === this.normalize(model);
        if (brandMatch && modelMatch) {
          return hit;
        }
      }
      return null;
    } catch (error) {
      this.logger.warn(`Meilisearch unavailable: ${(error as Error).message}`);
      return null;
    }
  }

  async indexProduct(data: { id: string; brand: string; model: string; specs: string }) {
    try {
      const index = this.client.index('products');
      await index.addDocuments([
        {
          id: data.id,
          brand_normalized: this.normalize(data.brand),
          model_normalized: this.normalize(data.model),
          specs_keywords: data.specs,
        },
      ]);
    } catch (error) {
      this.logger.warn(`Failed to index product: ${(error as Error).message}`);
    }
  }

  private normalize(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9а-я]/g, '').trim();
  }
}