import { Injectable, Logger } from '@nestjs/common';
import { McpTool, McpToolSchema, McpToolResult } from '../mcp-protocol.service';
import { PriceCalculatorService } from '../../logistics/price-calculator.service';
import { ApiShipService } from '../../logistics/apiship.service';

@Injectable()
export class NormalizeAndCalculateTool implements McpTool {
  private readonly logger = new Logger(NormalizeAndCalculateTool.name);

  schema: McpToolSchema = {
    name: 'normalize_and_calculate',
    description: 'Final price: real shipping via ApiShip API + per-country customs (RU 15%>200€, US 10%>$800, DE 19% VAT). Best deal sorted by total cost.',
    inputSchema: {
      type: 'object',
      properties: {
        offers: { type: 'array', description: 'Array of offers from search results' },
        categoryId: { type: 'number', default: 19 },
        toCity: { type: 'string', default: 'Москва' },
        userCountry: { type: 'string', description: 'Buyer country: RU, US, or DE', default: 'RU' },
      },
    },
  };

  constructor(
    private calculator: PriceCalculatorService,
    private apiship: ApiShipService,
  ) {}

  async execute(args: Record<string, any>): Promise<McpToolResult> {
    const { offers, categoryId, toCity, userCountry } = args;
    const catId = typeof categoryId === 'number' ? categoryId : 19;
    const country: 'RU' | 'US' | 'DE' = (userCountry || 'RU') as 'RU' | 'US' | 'DE';

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
      const isCrossBorder = origin !== country;

      // Base calc (tariff shipping + customs)
      const calc = this.calculator.calculateFinalPrice(offer.price, offer.currency, catId, origin, country);

      // Try ApiShip for real international rates, fallback to tariff
      let shippingCost = calc.shippingCost;
      let deliveryDays = calc.deliveryDays;
      if (isCrossBorder) {
        try {
          const apishipResult = await this.apiship.calculateDelivery({
            weight: Math.max(weight, 0.5), width: 20, height: 15, depth: 10,
            fromCity: origin === 'RU' ? 'Москва' : origin === 'US' ? 'New York' : 'Berlin',
            toCity: toCity || 'Москва',
            declaredPrice: priceInRub,
          });
          if (apishipResult.length > 0) {
            const best = apishipResult.reduce((min, e) => e.price < min.price ? e : min);
            shippingCost = best.price;
            deliveryDays = `${best.daysMin}-${best.daysMax} дн (${best.carrier})`;
          }
        } catch {
          this.logger.warn(`ApiShip fallback to tariff for ${origin}->${country}`);
        }
      }

      const finalPrice = priceInRub + shippingCost + calc.customsDuty;

      normalized.push({
        shop: offer.shop || offer.store || offer.seller || 'Unknown',
        price: offer.price,
        currency: offer.currency,
        priceInRub,
        weight,
        shippingCost: Math.round(shippingCost),
        deliveryDays,
        customsDuty: calc.customsDuty,
        finalPrice: Math.round(finalPrice),
        url: offer.url,
        originRegion: origin,
        userCountry: country,
        isCrossBorder,
      });
    }

    normalized.sort((a: any, b: any) => a.finalPrice - b.finalPrice);

    return {
      content: [{ type: 'text', text: JSON.stringify({
        categoryId: catId, userCountry: country, weight,
        normalized, bestDeal: normalized[0] || null, totalOptions: normalized.length,
      }, null, 2) }],
    };
  }
}
