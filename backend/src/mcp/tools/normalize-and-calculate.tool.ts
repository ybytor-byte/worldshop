import { Injectable, Logger } from '@nestjs/common';
import { McpTool, McpToolSchema, McpToolResult } from '../mcp-protocol.service';
import { PriceCalculatorService } from '../../logistics/price-calculator.service';
import { ApiShipService } from '../../logistics/apiship.service';

@Injectable()
export class NormalizeAndCalculateTool implements McpTool {
  private readonly logger = new Logger(NormalizeAndCalculateTool.name);

  schema: McpToolSchema = {
    name: 'normalize_and_calculate',
    description: 'Calculate final price: real shipping via ApiShip API + customs duty via math formula (15% above 200€). Returns best deal sorted by total cost.',
    inputSchema: {
      type: 'object',
      properties: {
        offers: { type: 'array', description: 'Array of offers from search results' },
        categoryId: { type: 'number', description: 'Category ID for weight lookup (14=shoes, 15=clothing, 16=electronics, 22=phone, 23=laptop)', default: 19 },
        toCity: { type: 'string', description: 'Destination city for last-mile delivery', default: 'Москва' },
      },
    },
  };

  constructor(
    private calculator: PriceCalculatorService,
    private apiship: ApiShipService,
  ) {}

  async execute(args: Record<string, any>): Promise<McpToolResult> {
    const { offers, categoryId, toCity } = args;
    const catId = typeof categoryId === 'number' ? categoryId : 19;

    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'No offers provided', normalized: [], bestDeal: null }) }],
        isError: true,
      };
    }

    const weight = this.calculator.getWeight(catId);

    const normalized: any[] = [];
    for (const offer of offers) {
      const origin = this.calculator.inferRegion(offer.url, offer.region);
      const priceInRub = this.calculator.toRub(offer.price, offer.currency);
      const priceInEuro = this.calculator.toEuro(offer.price, offer.currency);

      const normalizedOffer: any = {
        shop: offer.shop || offer.store || offer.seller || 'Unknown',
        price: offer.price,
        currency: offer.currency,
        priceInRub,
        weight,
        url: offer.url,
        originRegion: origin,
      };

      // Shipping via ApiShip API (international + last-mile)
      const shippingEstimates = await this.apiship.calculateDelivery({
        weight: Math.max(weight, 0.5),
        width: 20, height: 15, depth: 10,
        fromCity: origin === 'RU' ? 'Москва' : 'Москва',
        toCity: toCity || 'Москва',
        declaredPrice: priceInRub,
      });
      const shippingCost = shippingEstimates.reduce((min, e) => e.price < min.price ? e : min, shippingEstimates[0])?.price || 0;
      const deliveryDays = shippingEstimates.map(e => `${e.carrier}: ${e.daysMin}-${e.daysMax} дн`).join(', ');

      // Customs via math formula
      const customsDuty = origin !== 'RU' ? this.calculator.calculateCustomsDuty(priceInEuro, weight) : 0;

      const finalPrice = priceInRub + shippingCost + customsDuty;

      normalized.push({
        ...normalizedOffer,
        shippingCost: Math.round(shippingCost),
        deliveryDays,
        customsDuty,
        finalPrice: Math.round(finalPrice),
      });
    }

    normalized.sort((a: any, b: any) => a.finalPrice - b.finalPrice);

    return {
      content: [{ type: 'text', text: JSON.stringify({ categoryId: catId, normalized, bestDeal: normalized[0] || null, totalOptions: normalized.length }, null, 2) }],
    };
  }
}
