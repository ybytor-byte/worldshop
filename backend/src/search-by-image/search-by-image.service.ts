import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { HermesService } from '../hermes/hermes.service';
import { SearchApiLensProvider } from '../search/providers/searchapi-lens.provider';
import { HermesQueueService } from '../queue/hermes-queue.service';
import { PriceCalculatorService } from '../logistics/price-calculator.service';
import { ApiShipService } from '../logistics/apiship.service';

const ALL_REGIONS = ['RU', 'US', 'EU', 'ASIA'];

@Injectable()
export class SearchByImageService {
  private readonly logger = new Logger(SearchByImageService.name);

  constructor(
    private searchService: SearchService,
    private cloudinary: CloudinaryService,
    private hermes: HermesService,
    private searchApiLens: SearchApiLensProvider,
    private hermesQueue: HermesQueueService,
    private calculator: PriceCalculatorService,
    private apiship: ApiShipService,
  ) {}

  private async cleanProductName(rawName: string): Promise<string> {
    return rawName.replace(/купить.*$/i, '').replace(/с доставкой.*$/i, '').replace(/цена.*$/i, '').trim().slice(0, 60);
  }

  private async enrichOffers(offers: any[], categoryId: number, toCity: string, userCountry: 'RU' | 'US' | 'DE' = 'RU') {
    // Group cross-border offers by origin for batched ApiShip calls
    const crossBorder: Record<string, any[]> = {};
    const results: any[] = [];

    for (const offer of offers) {
      const origin = this.calculator.inferRegion(offer.url, offer.region);
      const isCrossBorder = origin !== userCountry;

      if (isCrossBorder) {
        if (!crossBorder[origin]) crossBorder[origin] = [];
        crossBorder[origin].push({ offer, origin });
      } else {
        const calc = this.calculator.calculateFinalPrice(offer.price, offer.currency, categoryId, origin, userCountry);
        results.push({ offer, origin, calc, isCrossBorder: false });
      }
    }

    // Batch ApiShip by origin region
    for (const [origin, group] of Object.entries(crossBorder)) {
      const firstOffer = group[0].offer;
      const priceInRub = this.calculator.toRub(firstOffer.price, firstOffer.currency);
      const weight = this.calculator.getWeight(categoryId);

      let shippingCost: number | null = null;
      let deliveryDays = 'Доставка уточняется';

      try {
        const fromCity = origin === 'RU' ? 'Москва' : origin === 'US' ? 'New York' : origin === 'DE' ? 'Berlin' : 'Shanghai';
        const estimates = await this.apiship.calculateDelivery({
          weight: Math.max(weight, 0.5), width: 20, height: 15, depth: 10,
          fromCity, toCity: toCity || 'Москва', declaredPrice: priceInRub,
        });
        if (estimates.length > 0) {
          const best = estimates.reduce((min, e) => e.price < min.price ? e : min);
          shippingCost = best.price;
          deliveryDays = `${best.daysMin}-${best.daysMax} дн (${best.carrier})`;
        }
      } catch {
        this.logger.warn(`ApiShip failed for ${origin}, using tariff fallback`);
      }

      for (const { offer } of group) {
        let calc: any;
        if (shippingCost !== null) {
          const base = this.calculator.calculateFinalPrice(offer.price, offer.currency, categoryId, origin, userCountry);
          calc = { ...base, shippingCost, deliveryDays };
        } else {
          calc = this.calculator.calculateFinalPrice(offer.price, offer.currency, categoryId, origin, userCountry);
        }
        results.push({ offer, origin, calc, isCrossBorder: true });
      }
    }

    return results.map(({ offer, origin, calc }) => ({
      shop: offer.shop || 'Unknown',
      price: offer.price,
      currency: offer.currency,
      url: offer.url,
      region: offer.region || origin,
      shipping: Math.round(calc.shippingCost),
      deliveryDays: calc.deliveryDays,
      customsDuty: calc.customsDuty,
      finalPrice: Math.round(calc.finalPrice),
      priceInRub: calc.priceInRub,
      weight: calc.weight,
      isCrossBorder: calc.isCrossBorder,
    }));
  }

  async searchByImageUpload(buffer: Buffer, mimetype: string, region = 'RU') {
    const imageUrl = await this.cloudinary.uploadImage(buffer);
    this.logger.log(`Image uploaded to Cloudinary: ${imageUrl}`);

    const lensResults = await this.searchApiLens.identifyByImage(imageUrl, 'ru', 'ru');
    const rawProductName = this.searchApiLens.extractProductName(lensResults);

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
    const filteredOffers = allOffers.filter(o => {
      if (!o.url) return false;
      const u = o.url.toLowerCase();
      if (u.includes('doubleclick.net') || u.includes('googlesyndication.com') || u.includes('/aclk') || u.includes('google.com/url?')) return false;
      return true;
    });

    // Enrich with real ApiShip shipping + per-country customs
    const enriched = await this.enrichOffers(filteredOffers, 19, 'Москва', 'RU');

    enriched.sort((a, b) => a.finalPrice - b.finalPrice);

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

    const allOffers = regionResults.flat().filter(o => {
      if (!o.url) return false;
      const u = o.url.toLowerCase();
      if (u.includes('doubleclick.net') || u.includes('googlesyndication.com') || u.includes('/aclk') || u.includes('google.com/url?')) return false;
      return true;
    });
    const enriched = await this.enrichOffers(allOffers, 19, 'Москва', 'RU');
    enriched.sort((a, b) => a.finalPrice - b.finalPrice);

    return { query: cleanQuery, region, offers: enriched, keywords };
  }
}
