import { Injectable, Logger } from '@nestjs/common';
import { McpTool, McpToolSchema, McpToolResult } from '../mcp-protocol.service';
import { PriceCalculatorService } from '../../logistics/price-calculator.service';

interface Offer {
  shop: string;
  price: number;
  currency: string;
  url: string;
  region?: string;
  categoryId?: number;
}

@Injectable()
export class NormalizeAndCalculateTool implements McpTool {
  private readonly logger = new Logger(NormalizeAndCalculateTool.name);

  schema: McpToolSchema = {
    name: 'normalize_and_calculate',
    description: 'Normalize prices to RUB, calculate shipping costs by region, import duties (15% above 200€), and find the best deal. Zero API calls — pure math.',
    inputSchema: {
      type: 'object',
      properties: {
        offers: { type: 'array', description: 'Array of offers from search results' },
        categoryId: { type: 'number', description: 'Product category ID for weight lookup (14=shoes, 15=clothing, 16=electronics, 22=phone, 23=laptop)', default: 19 },
      },
    },
  };

  constructor(private calculator: PriceCalculatorService) {}

  async execute(args: Record<string, any>): Promise<McpToolResult> {
    const { offers, categoryId } = args;
    const catId = typeof categoryId === 'number' ? categoryId : 19;

    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'No offers provided', normalized: [], bestDeal: null }) }],
        isError: true,
      };
    }

    const normalized = offers.map((offer: any) => {
      const origin = this.calculator.inferRegion(offer.url, offer.region);
      const calc = this.calculator.calculateFinalPrice(offer.price, offer.currency, catId, origin);
      return {
        shop: offer.shop,
        price: offer.price,
        currency: offer.currency,
        priceInRub: calc.priceInRub,
        weight: calc.weight,
        shippingCost: calc.shippingCost,
        deliveryDays: calc.deliveryDays,
        customsDuty: calc.customsDuty,
        finalPrice: calc.finalPrice,
        url: offer.url,
        originRegion: origin,
      };
    });

    normalized.sort((a: any, b: any) => a.finalPrice - b.finalPrice);

    const bestDeal = normalized.length > 0 ? normalized[0] : null;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          categoryId: catId,
          weight: bestDeal ? this.calculator.getWeight(catId) : 0,
          normalized,
          bestDeal,
          totalOptions: normalized.length,
        }, null, 2),
      }],
    };
  }
}
