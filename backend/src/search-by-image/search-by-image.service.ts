import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../search/search.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { HermesService } from '../hermes/hermes.service';
import { SerperLensProvider } from '../search/providers/serper-lens.provider';
import { HermesQueueService } from '../queue/hermes-queue.service';

@Injectable()
export class SearchByImageService {
  private readonly logger = new Logger(SearchByImageService.name);

  constructor(
    private configService: ConfigService,
    private searchService: SearchService,
    private cloudinary: CloudinaryService,
    private hermes: HermesService,
    private serperLens: SerperLensProvider,
    private hermesQueue: HermesQueueService,
  ) {}

  private async cleanProductName(rawName: string): Promise<string> {
    return rawName.replace(/купить.*$/i, '').replace(/с доставкой.*$/i, '').replace(/цена.*$/i, '').trim().slice(0, 60);
  }

  async searchByImageUpload(buffer: Buffer, mimetype: string, region = 'RU') {
    const imageUrl = await this.cloudinary.uploadImage(buffer);
    this.logger.log(`Image uploaded to Cloudinary: ${imageUrl}`);

    const lensResults = await this.serperLens.identifyByImage(imageUrl, 'ru', 'ru');
    const rawProductName = this.serperLens.extractProductName(lensResults);

    if (!rawProductName) {
      return {
        identified: false,
        message: 'Не удалось распознать товар на фото',
        offers: [],
        visualMatches: lensResults.map(r => ({ title: r.title, source: r.source, link: r.link, imageUrl: r.imageUrl })),
      };
    }

    this.logger.log(`Serper Lens identified raw: "${rawProductName}"`);

    const productName = await this.cleanProductName(rawProductName);

    let offers: any[] = [];
    try {
      offers = await this.searchService.searchProducts({ text: productName, region: region || 'RU' });
    } catch {
      this.logger.warn('Serper Shopping failed');
    }

    const filteredOffers = offers.filter(o => o.price > 0 || (o.price === 0 && o.url && !o.url.includes('google.com')));

    // Enqueue deep processing for Hermes Agent (non-blocking, fire-and-forget)
    this.hermesQueue.addJob({
      imageUrl,
      productName,
      region: region || 'RU',
    }).catch(err => this.logger.warn('Failed to enqueue Hermes job', err));

    return {
      identified: true,
      productName,
      rawProductName,
      offers: filteredOffers,
      visualMatches: lensResults.map(r => ({ title: r.title, source: r.source, link: r.link, imageUrl: r.imageUrl })),
    };
  }

  async searchByKeywords(keywords: string[], region: string = 'RU') {
    const query = keywords.join(' ');
    const cleanQuery = await this.cleanProductName(query);
    const offers = await this.searchService.searchProducts({ text: cleanQuery, region });
    return { query: cleanQuery, region, offers, keywords };
  }
}