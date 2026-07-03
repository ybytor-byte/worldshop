import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { HermesService } from '../hermes/hermes.service';
import { SerperLensProvider } from '../search/providers/serper-lens.provider';
import { HermesQueueService } from '../queue/hermes-queue.service';
import { PriceCalculatorService } from '../logistics/price-calculator.service';

const ALL_REGIONS = ['RU', 'US', 'EU', 'ASIA'];

@Injectable()
export class SearchByImageService {
  private readonly logger = new Logger(SearchByImageService.name);

  constructor(
    private searchService: SearchService,
    private cloudinary: CloudinaryService,
    private hermes: HermesService,
    private serperLens: SerperLensProvider,
    private hermesQueue: HermesQueueService,
    private calculator: PriceCalculatorService,
  ) {}

  private async cleanProductName(rawName: string): Promise<string> {
    return rawName.replace(/купить.*$/i, '').replace(/с доставкой.*$/i, '').replace(/цена.*$/i, '').trim().slice(0, 60);
  }

  private enrichOffer(offer: any, categoryId: number, userCountry: 'RU' | 'US' | 'DE' = 'RU') {
    const origin = this.calculator.inferRegion(offer.url, offer.region);
    const calc = this.calculator.calculateFinalPrice(offer.price, offer.currency, categoryId, origin, userCountry);
    return {
      shop: offer.shop || 'Unknown',
      price: offer.price,
      currency: offer.currency,
      url: offer.url,
      region: offer.region || origin,
      shipping: calc.shippingCost,
      deliveryDays: calc.deliveryDays,
      customsDuty: calc.customsDuty,
      finalPrice: calc.finalPrice,
      priceInRub: calc.priceInRub,
      weight: calc.weight,
      isCrossBorder: calc.isCrossBorder,
    };
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

    // Search ALL regions in parallel
    const regionResults = await Promise.all(
      ALL_REGIONS.map(r =>
        this.searchService.searchProducts({ text: productName, region: r })
          .catch(() => []),
      ),
    );

    const allOffers = regionResults.flat();
    const filteredOffers = allOffers.filter(o => o.price > 0 || (o.price === 0 && o.url && !o.url.includes('google.com')));

    // Enrich every offer with shipping + customs calculation
    const enriched = filteredOffers.map(o => this.enrichOffer(o, 19, 'RU'));

    // Sort by final price ascending
    enriched.sort((a, b) => a.finalPrice - b.finalPrice);

    // Enqueue deep processing for Hermes Agent (non-blocking, fire-and-forget)
    this.hermesQueue.addJob({ imageUrl, productName, region: region || 'RU' })
      .catch(err => this.logger.warn('Failed to enqueue Hermes job', err));

    return {
      identified: true,
      productName,
      rawProductName,
      offers: enriched,
      visualMatches: lensResults.map(r => ({ title: r.title, source: r.source, link: r.link, imageUrl: r.imageUrl })),
    };
  }

  async searchByKeywords(keywords: string[], region = 'RU') {
    const query = keywords.join(' ');
    const cleanQuery = await this.cleanProductName(query);

    const regionResults = await Promise.all(
      ALL_REGIONS.map(r =>
        this.searchService.searchProducts({ text: cleanQuery, region: r })
          .catch(() => []),
      ),
    );

    const allOffers = regionResults.flat();
    const enriched = allOffers.map(o => this.enrichOffer(o, 19, 'RU'));
    enriched.sort((a, b) => a.finalPrice - b.finalPrice);

    return { query: cleanQuery, region, offers: enriched, keywords };
  }
}
