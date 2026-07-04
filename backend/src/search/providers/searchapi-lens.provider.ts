import { Injectable, Logger } from '@nestjs/common';

export interface LensResult {
  title: string;
  source: string;
  link: string;
  imageUrl: string;
  thumbnailUrl: string;
  price?: number;
  currency?: string;
}

const SEARCHAPI_KEY = 'bwetm5ZbkwqYuBw7eJHTozrU';
const BASE_URL = 'https://www.searchapi.io/api/v1/search';

@Injectable()
export class SearchApiLensProvider {
  readonly name = 'searchapi-lens';
  private readonly logger = new Logger(SearchApiLensProvider.name);

  async identifyByImage(imageUrl: string, gl = 'ru', hl = 'ru'): Promise<LensResult[]> {
    try {
      const params = new URLSearchParams({
        engine: 'google_lens',
        url: imageUrl,
        gl, hl,
        api_key: SEARCHAPI_KEY,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${BASE_URL}?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        this.logger.warn(`SearchApi Lens returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      const matches = data.visual_matches || [];

      return matches.slice(0, 10).map((m: any) => ({
        title: m.title || '',
        source: m.source || '',
        link: m.link || '',
        imageUrl: m.image || m.thumbnail || '',
        thumbnailUrl: m.thumbnail || m.image || '',
        price: m.extracted_price,
        currency: m.currency,
      }));
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes('abort')) {
        this.logger.warn('SearchApi Lens request timed out');
      } else {
        this.logger.warn(`SearchApi Lens request failed: ${msg}`);
      }
      return [];
    }
  }

  extractProductName(results: LensResult[]): string {
    if (results.length === 0) return '';
    const best = results[0];
    let title = best.title;
    title = title.replace(/\s+/g, ' ').trim();
    title = title.replace(/^Buy\s+/i, '');
    title = title.replace(/\s*[-|]\s*.*$/, '');
    return title.trim();
  }
}
