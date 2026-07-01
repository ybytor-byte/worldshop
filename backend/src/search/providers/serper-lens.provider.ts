import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LensResult {
  title: string;
  source: string;
  link: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export interface LensResponse {
  organic: LensResult[];
  searchParameters: { gl: string; hl: string; url: string };
}

@Injectable()
export class SerperLensProvider {
  readonly name = 'serper-lens';
  private readonly apiKey: string;
  private readonly logger = new Logger(SerperLensProvider.name);
  private readonly baseUrl = 'https://google.serper.dev/lens';

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('SERPER_KEY') || '';
  }

  async identifyByImage(imageUrl: string, gl = 'ru', hl = 'ru'): Promise<LensResult[]> {
    if (!this.apiKey) {
      this.logger.warn('Serper API key not configured');
      return [];
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({ url: imageUrl, gl, hl }),
      });

      if (!response.ok) {
        this.logger.warn(`Serper Lens API returned ${response.status}`);
        return [];
      }

      const data: LensResponse = await response.json();
      return data.organic || [];
    } catch (error) {
      this.logger.warn(`Serper Lens request failed: ${(error as Error).message}`);
      return [];
    }
  }

  extractProductName(organic: LensResult[]): string {
    if (organic.length === 0) return '';
    const best = organic[0];
    let title = best.title;
    title = title.replace(/\s+/g, ' ').trim();
    title = title.replace(/^Buy\s+/i, '');
    title = title.replace(/\s*[-|]\s*.*$/, '');
    return title.trim();
  }
}
