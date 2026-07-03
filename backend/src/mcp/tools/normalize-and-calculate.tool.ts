import { Injectable, Logger } from '@nestjs/common';
import { McpTool, McpToolSchema, McpToolResult } from '../mcp-protocol.service';
import { ApiShipService } from '../../logistics/apiship.service';

interface Offer {
  shop: string;
  price: number;
  currency: string;
  url: string;
  region?: string;
}

const CURRENCY_RATES: Record<string, number> = {
  RUB: 1,
  USD: 90,
  EUR: 98,
  CNY: 12.5,
  KZT: 0.19,
  GBP: 114,
  JPY: 0.6,
};

const CATEGORY_WEIGHT: Record<string, number> = {
  electronics: 0.5,
  clothing: 0.3,
  shoes: 0.8,
  books: 0.4,
  cosmetics: 0.2,
  toys: 0.3,
  default: 0.5,
};

@Injectable()
export class NormalizeAndCalculateTool implements McpTool {
  private readonly logger = new Logger(NormalizeAndCalculateTool.name);

  schema: McpToolSchema = {
    name: 'normalize_and_calculate',
    description: 'Normalize prices to RUB, calculate shipping costs by region, import duties, and find the best deal.',
    inputSchema: {
      type: 'object',
      properties: {
        offers: { type: 'array', description: 'Array of offers from search results' },
        destinationRegion: { type: 'string', description: 'Destination region for delivery: RU, US, EU', default: 'RU' },
        productCategory: { type: 'string', description: 'Product category (electronics, clothing, shoes, etc.)', default: 'electronics' },
        toCity: { type: 'string', description: 'Destination city for ApiShip last-mile delivery', default: 'Москва' },
      },
    },
  };

  constructor(private apiship: ApiShipService) {}

  private getDutyRate(category: string): number {
    const rates: Record<string, number> = {
      electronics: 0.05,
      clothing: 0.15,
      shoes: 0.1,
      books: 0.0,
      food: 0.2,
      cosmetics: 0.15,
      toys: 0.1,
      default: 0.1,
    };
    return rates[category?.toLowerCase()] || rates.default;
  }

  private async getShippingRUB(originRegion: string, destRegion: string, category: string, fromCity: string, toCity: string): Promise<number> {
    if (originRegion === destRegion) return 0;
    const weight = CATEGORY_WEIGHT[category?.toLowerCase()] || CATEGORY_WEIGHT.default;

    if (destRegion === 'RU') {
      if (originRegion === 'RU') {
        const estimates = await this.apiship.calculateDelivery({
          weight, width: 20, height: 15, depth: 10,
          fromCity: fromCity || 'Москва', toCity: toCity || 'Москва',
          declaredPrice: 0,
        });
        const best = estimates.reduce((min, e) => e.price < min.price ? e : min, estimates[0]);
        return best?.price || 0;
      }
      if (originRegion === 'ASIA') return 15 * 90;
      if (originRegion === 'US') return 25 * 90;
      if (originRegion === 'EU') return 20 * 90;
    }
    return 10 * 90;
  }

  private toRUB(price: number, currency: string): number {
    const rate = CURRENCY_RATES[currency?.toUpperCase()] || CURRENCY_RATES.USD;
    return Math.round(price * rate);
  }

  private inferRegion(offer: Offer): string {
    if (offer.region) return offer.region.toUpperCase();
    const url = (offer.url || '').toLowerCase();
    if (url.includes('ozon') || url.includes('wildberries') || url.includes('yandex') || url.includes('dns-shop')) return 'RU';
    if (url.includes('amazon') || url.includes('walmart') || url.includes('bestbuy') || url.includes('ebay')) return 'US';
    if (url.includes('mediamarkt') || url.includes('amazon.de') || url.includes('amazon.fr') || url.includes('amazon.it')) return 'EU';
    if (url.includes('taobao') || url.includes('1688') || url.includes('aliexpress') || url.includes('jd.com')) return 'ASIA';
    return 'RU';
  }

  async execute(args: Record<string, any>): Promise<McpToolResult> {
    const { offers, destinationRegion, productCategory, toCity } = args;
    const dest = (destinationRegion || 'RU').toUpperCase();
    const category = productCategory || 'electronics';

    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'No offers provided', normalized: [], bestDeal: null }) }],
        isError: true,
      };
    }

    const dutyRate = this.getDutyRate(category);

    const normalized: any[] = [];
    for (const offer of offers) {
      const origin = this.inferRegion(offer);
      const priceRUB = this.toRUB(offer.price, offer.currency);
      const shippingRUB = await this.getShippingRUB(origin, dest, category, offer.region || toCity || 'Москва', toCity || 'Москва');
      const dutyRUB = origin !== dest ? Math.round(priceRUB * dutyRate) : 0;
      const totalRUB = priceRUB + shippingRUB + dutyRUB;

      normalized.push({
        shop: offer.shop,
        price: offer.price,
        currency: offer.currency,
        priceRUB,
        shippingRUB,
        dutyRUB,
        totalRUB,
        url: offer.url,
        originRegion: origin,
      });
    }

    normalized.sort((a: any, b: any) => a.totalRUB - b.totalRUB);

    const bestDeal = normalized.length > 0 ? normalized[0] : null;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          destinationRegion: dest,
          productCategory: category,
          dutyRate,
          normalized,
          bestDeal,
          totalOptions: normalized.length,
        }, null, 2),
      }],
    };
  }
}
