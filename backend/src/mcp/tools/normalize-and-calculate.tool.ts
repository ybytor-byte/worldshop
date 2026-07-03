import { Injectable, Logger } from '@nestjs/common';
import { McpTool, McpToolSchema, McpToolResult } from '../mcp-protocol.service';

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
      },
    },
  };

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

  private getShippingEstimate(originRegion: string, destRegion: string, price: number): number {
    if (originRegion === destRegion) return 0;
    if (destRegion === 'RU') {
      if (originRegion === 'ASIA') return price < 200 ? 5 : 15;
      if (originRegion === 'US') return price < 200 ? 10 : 25;
      if (originRegion === 'EU') return price < 200 ? 8 : 20;
    }
    if (destRegion === 'US') return 15;
    if (destRegion === 'EU') return 12;
    return 10;
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
    const { offers, destinationRegion, productCategory } = args;
    const dest = (destinationRegion || 'RU').toUpperCase();
    const category = productCategory || 'electronics';

    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'No offers provided', normalized: [], bestDeal: null }) }],
        isError: true,
      };
    }

    const dutyRate = this.getDutyRate(category);

    const normalized = offers.map((offer: any) => {
      const origin = this.inferRegion(offer);
      const priceRUB = this.toRUB(offer.price, offer.currency);
      const shippingRUB = this.getShippingEstimate(origin, dest, offer.price) * CURRENCY_RATES.USD;
      const dutyRUB = origin !== dest ? Math.round(priceRUB * dutyRate) : 0;
      const totalRUB = priceRUB + shippingRUB + dutyRUB;

      return {
        shop: offer.shop,
        price: offer.price,
        currency: offer.currency,
        priceRUB,
        shippingRUB,
        dutyRUB,
        totalRUB,
        url: offer.url,
        originRegion: origin,
      };
    });

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
