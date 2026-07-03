import { Injectable } from '@nestjs/common';

interface ShippingTariff {
  basePrice: number;
  pricePerKg: number;
  deliveryDays: string;
}

const CATEGORY_WEIGHTS: Record<number, number> = {
  14: 1.0,
  15: 0.3,
  16: 0.8,
  17: 0.2,
  18: 1.5,
  19: 1.0,
  22: 0.5,
  23: 2.5,
};

const SHIPPING_TARIFFS: Record<string, ShippingTariff> = {
  US: { basePrice: 1200, pricePerKg: 900, deliveryDays: '14-20 дней' },
  CN: { basePrice: 500, pricePerKg: 450, deliveryDays: '20-30 дней' },
  DE: { basePrice: 1400, pricePerKg: 850, deliveryDays: '12-18 дней' },
};

const CURRENCY_RATES: Record<string, { rub: number; euro: number }> = {
  RUB: { rub: 1, euro: 0.01 },
  USD: { rub: 90, euro: 0.92 },
  EUR: { rub: 98, euro: 1 },
  CNY: { rub: 12.5, euro: 0.128 },
  GBP: { rub: 114, euro: 1.16 },
  JPY: { rub: 0.6, euro: 0.0061 },
  KZT: { rub: 0.19, euro: 0.0019 },
};

const REGION_MAP: Record<string, string> = {
  US: 'US', EU: 'DE', ASIA: 'CN', RU: 'RU',
};

@Injectable()
export class PriceCalculatorService {
  getWeight(categoryId: number): number {
    return CATEGORY_WEIGHTS[categoryId] || 1.0;
  }

  toRub(price: number, currency: string): number {
    const rate = CURRENCY_RATES[currency?.toUpperCase()];
    return rate ? Math.round(price * rate.rub) : Math.round(price * 90);
  }

  toEuro(price: number, currency: string): number {
    const rate = CURRENCY_RATES[currency?.toUpperCase()];
    return rate ? price * rate.euro : price * 0.01;
  }

  calculateCustomsDuty(priceInEuro: number, weightInKg: number): number {
    const LIMIT_EURO = 200;
    if (priceInEuro <= LIMIT_EURO) return 0;
    const dutyInEuro = (priceInEuro - LIMIT_EURO) * 0.15;
    const euroRate = CURRENCY_RATES.EUR.rub;
    return Math.round(dutyInEuro * euroRate);
  }

  calculateShipping(originRegion: string, weight: number): { cost: number; days: string } {
    const code = REGION_MAP[originRegion?.toUpperCase()] || 'US';
    const tariff = SHIPPING_TARIFFS[code];
    if (!tariff) return { cost: 0, days: 'Доставка уточняется' };
    return {
      cost: tariff.basePrice + weight * tariff.pricePerKg,
      days: tariff.deliveryDays,
    };
  }

  inferRegion(url: string, explicitRegion?: string): string {
    if (explicitRegion) return explicitRegion.toUpperCase();
    const u = (url || '').toLowerCase();
    if (u.includes('ozon') || u.includes('wildberries') || u.includes('yandex') || u.includes('dns-shop')) return 'RU';
    if (u.includes('amazon') || u.includes('walmart') || u.includes('bestbuy') || u.includes('ebay')) return 'US';
    if (u.includes('mediamarkt') || u.includes('amazon.de') || u.includes('amazon.fr') || u.includes('amazon.it')) return 'EU';
    if (u.includes('taobao') || u.includes('1688') || u.includes('aliexpress') || u.includes('jd.com')) return 'ASIA';
    return 'RU';
  }

  calculateFinalPrice(rawPrice: number, currency: string, categoryId: number, originRegion: string) {
    const priceInRub = this.toRub(rawPrice, currency);
    const priceInEuro = this.toEuro(rawPrice, currency);
    const weight = this.getWeight(categoryId);
    const shipping = this.calculateShipping(originRegion, weight);
    const customsDuty = originRegion !== 'RU' ? this.calculateCustomsDuty(priceInEuro, weight) : 0;
    const finalPrice = priceInRub + shipping.cost + customsDuty;

    return {
      sourcePrice: rawPrice,
      sourceCurrency: currency,
      priceInRub,
      weight,
      shippingCost: shipping.cost,
      deliveryDays: shipping.days,
      customsDuty,
      finalPrice: Math.round(finalPrice),
    };
  }
}
