import { Injectable } from '@nestjs/common';

interface ShippingTariff {
  basePrice: number;
  pricePerKg: number;
  deliveryDays: string;
}

const CATEGORY_WEIGHTS: Record<number, number> = {
  14: 1.0, 15: 0.3, 16: 0.8, 17: 0.2,
  18: 1.5, 19: 1.0, 22: 0.5, 23: 2.5,
};

const SHIPPING_TARIFFS: Record<string, ShippingTariff> = {
  US: { basePrice: 1200, pricePerKg: 900, deliveryDays: '14-20 дней' },
  CN: { basePrice: 500, pricePerKg: 450, deliveryDays: '20-30 дней' },
  DE: { basePrice: 1400, pricePerKg: 850, deliveryDays: '12-18 дней' },
};

const DOMESTIC_TARIFFS: Record<string, { basePrice: number; pricePerKg: number }> = {
  RU: { basePrice: 300, pricePerKg: 100 },
};

const RATES: Record<string, number> = {
  USD: 93, EUR: 101, CNY: 12.9, RUB: 1,
  GBP: 114, JPY: 0.6, KZT: 0.19,
};

const REGION_MAP: Record<string, string> = {
  US: 'US', EU: 'DE', ASIA: 'CN', RU: 'RU',
  CN: 'CN', DE: 'DE',
};

type UserCountry = 'RU' | 'US' | 'DE';
type OriginRegion = 'US' | 'CN' | 'DE' | 'RU';

@Injectable()
export class PriceCalculatorService {
  getWeight(categoryId: number): number {
    return CATEGORY_WEIGHTS[categoryId] || 1.0;
  }

  toRub(price: number, currency: string): number {
    const rate = RATES[currency?.toUpperCase()];
    return rate ? Math.round(price * rate) : Math.round(price * 90);
  }

  convert(price: number, from: string, to: string): number {
    const fromRate = RATES[from?.toUpperCase()] || 90;
    const toRate = RATES[to?.toUpperCase()] || 1;
    return (price * fromRate) / toRate;
  }

  /** Customs duty based on buyer's country rules */
  private calcCustoms(priceInRub: number, userCountry: UserCountry): number {
    const priceInEuro = priceInRub / RATES.EUR;
    const priceInUsd = priceInRub / RATES.USD;

    switch (userCountry) {
      case 'RU': {
        const LIMIT = 200;
        if (priceInEuro <= LIMIT) return 0;
        return Math.round((priceInEuro - LIMIT) * 0.15 * RATES.EUR);
      }
      case 'US': {
        const LIMIT = 800;
        if (priceInUsd <= LIMIT) return 0;
        return Math.round(priceInUsd * 0.10 * RATES.USD);
      }
      case 'DE': {
        return Math.round(priceInRub * 0.19);
      }
      default:
        return 0;
    }
  }

  inferRegion(url: string, explicitRegion?: string): string {
    if (explicitRegion) return explicitRegion.toUpperCase();
    const u = (url || '').toLowerCase();
    if (u.includes('ozon') || u.includes('wildberries') || u.includes('yandex') || u.includes('dns-shop')) return 'RU';
    if (u.includes('amazon.de') || u.includes('amazon.fr') || u.includes('amazon.it') || u.includes('amazon.co.uk') || u.includes('mediamarkt') || u.includes('zalando')) return 'DE';
    if (u.includes('amazon') || u.includes('walmart') || u.includes('bestbuy') || u.includes('ebay')) return 'US';
    if (u.includes('taobao') || u.includes('1688') || u.includes('aliexpress') || u.includes('jd.com')) return 'CN';
    return 'RU';
  }

  inferUserCountry(ip?: string, header?: string): UserCountry {
    if (header === 'RU' || header === 'US' || header === 'DE') return header;
    return 'RU';
  }

  /** Calculate final price with per-country customs + shipping */
  calculateFinalPrice(
    rawPrice: number,
    currency: string,
    categoryId: number,
    originRegion: string,
    userCountry: UserCountry = 'RU',
  ) {
    const priceInRub = this.toRub(rawPrice, currency);
    const weight = this.getWeight(categoryId);

    const origin: OriginRegion = (REGION_MAP[originRegion?.toUpperCase()] || 'RU') as OriginRegion;
    const isCrossBorder = origin !== userCountry;

    let shippingCost = 0;
    let deliveryDays = 'Доставка уточняется';

    if (isCrossBorder) {
      const tariff = SHIPPING_TARIFFS[origin];
      if (tariff) {
        shippingCost = tariff.basePrice + weight * tariff.pricePerKg;
        deliveryDays = tariff.deliveryDays;
      }
    } else {
      const local = DOMESTIC_TARIFFS[userCountry];
      if (local) {
        shippingCost = local.basePrice + weight * local.pricePerKg;
        deliveryDays = '1-3 дня';
      }
    }

    const customsDuty = isCrossBorder ? this.calcCustoms(priceInRub, userCountry) : 0;

    const finalPrice = priceInRub + shippingCost + customsDuty;

    return {
      sourcePrice: rawPrice,
      sourceCurrency: currency,
      priceInRub,
      weight,
      shippingCost: Math.round(shippingCost),
      deliveryDays,
      customsDuty,
      finalPrice: Math.round(finalPrice),
      isCrossBorder,
      userCountry,
    };
  }
}
