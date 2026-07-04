import { PriceCalculatorService } from './price-calculator.service';

describe('PriceCalculatorService', () => {
  let service: PriceCalculatorService;

  beforeEach(() => {
    service = new PriceCalculatorService();
  });

  describe('getWeight', () => {
    it('returns weight for known categories', () => {
      expect(service.getWeight(14)).toBe(1.0);  // shoes
      expect(service.getWeight(15)).toBe(0.3);  // t-shirt
      expect(service.getWeight(22)).toBe(0.5);  // phone
      expect(service.getWeight(23)).toBe(2.5);  // laptop
    });

    it('returns 1.0 default for unknown categories', () => {
      expect(service.getWeight(0)).toBe(1.0);
      expect(service.getWeight(999)).toBe(1.0);
    });
  });

  describe('toRub', () => {
    it('converts USD to RUB', () => {
      expect(service.toRub(100, 'USD')).toBe(9300);
    });

    it('converts EUR to RUB', () => {
      expect(service.toRub(200, 'EUR')).toBe(20200);
    });

    it('converts CNY to RUB', () => {
      expect(service.toRub(500, 'CNY')).toBe(6450);
    });

    it('returns identity for RUB', () => {
      expect(service.toRub(1500, 'RUB')).toBe(1500);
    });

    it('falls back to 90x for unknown currency', () => {
      expect(service.toRub(10, 'BTC')).toBe(900);
    });
  });

  describe('inferRegion', () => {
    it('returns explicit region when provided', () => {
      expect(service.inferRegion('https://bestbuy.com/p', 'CN')).toBe('CN');
    });

    it('detects US from walmart.com', () => {
      expect(service.inferRegion('https://walmart.com/dp/B09X')).toBe('US');
    });

    it('detects US from walmart', () => {
      expect(service.inferRegion('https://walmart.com/ip/123')).toBe('US');
    });

    it('detects US from ebay', () => {
      expect(service.inferRegion('https://ebay.com/itm/456')).toBe('US');
    });

    it('detects RU from wildberries', () => {
      expect(service.inferRegion('https://wildberries.ru/catalog/123')).toBe('RU');
    });

    it('detects RU from ozon', () => {
      expect(service.inferRegion('https://ozon.ru/product/456')).toBe('RU');
    });

    it('detects RU from yandex.market', () => {
      expect(service.inferRegion('https://market.yandex.ru/product/789')).toBe('RU');
    });

    it('detects DE from mediamarkt.de', () => {
      expect(service.inferRegion('https://mediamarkt.de/dp/B09Y')).toBe('DE');
    });

    it('detects DE from zalando', () => {
      expect(service.inferRegion('https://zalando.de/product/123')).toBe('DE');
    });

    it('detects CN from taobao', () => {
      expect(service.inferRegion('https://taobao.com/item/123')).toBe('CN');
    });

    it('detects CN from aliexpress', () => {
      expect(service.inferRegion('https://aliexpress.com/item/456')).toBe('CN');
    });

    it('detects CN from 1688', () => {
      expect(service.inferRegion('https://detail.1688.com/offer/789')).toBe('CN');
    });

    it('defaults to RU for unknown URL', () => {
      expect(service.inferRegion('https://unknown-shop.com/p')).toBe('RU');
    });
  });

  describe('calculateFinalPrice (RU buyer)', () => {
    it('domestic RU purchase: no customs, local shipping', () => {
      const r = service.calculateFinalPrice(5000, 'RUB', 15, 'RU', 'RU');
      expect(r.isCrossBorder).toBe(false);
      expect(r.customsDuty).toBe(0);
      expect(r.shippingCost).toBe(330);  // 300 + 0.3*100
      expect(r.deliveryDays).toBe('1-3 дня');
      expect(r.priceInRub).toBe(5000);
      expect(r.finalPrice).toBe(5330);
    });

    it('US origin, price under 200€: 0 customs', () => {
      // $150 ≈ 13950 RUB ≈ 138€ — under 200€ limit
      const r = service.calculateFinalPrice(150, 'USD', 19, 'US', 'RU');
      expect(r.isCrossBorder).toBe(true);
      expect(r.customsDuty).toBe(0);
      expect(r.priceInRub).toBe(13950);
      expect(r.shippingCost).toBeGreaterThan(0);
    });

    it('US origin, price above 200€: 15% on excess', () => {
      // $300 → 27900 RUB → 276.24€ → excess 76.24€ → 76.24*0.15*101 = 1155
      const r = service.calculateFinalPrice(300, 'USD', 19, 'US', 'RU');
      expect(r.isCrossBorder).toBe(true);
      expect(r.customsDuty).toBe(1155);
      expect(r.shippingCost).toBeGreaterThan(0);
      expect(r.finalPrice).toBeGreaterThan(r.priceInRub + r.shippingCost);
    });

    it('CN origin, shoes (cat 14, 1kg), price under 200€', () => {
      const r = service.calculateFinalPrice(150, 'CNY', 14, 'CN', 'RU');
      expect(r.isCrossBorder).toBe(true);
      expect(r.customsDuty).toBe(0);
      expect(r.weight).toBe(1.0);
      expect(r.shippingCost).toBe(950);
    });

    it('CN origin, phone (cat 22, 0.5kg), price above 200€', () => {
      // ¥3000 → 38700 RUB → 383.17€ → excess 183.17€ → 183.17*0.15*101 ≈ 2775
      const r = service.calculateFinalPrice(3000, 'CNY', 22, 'CN', 'RU');
      expect(r.weight).toBe(0.5);
      expect(r.customsDuty).toBe(2775);
      expect(r.shippingCost).toBe(725);
    });

    it('DE origin, laptop (cat 23, 2.5kg)', () => {
      const r = service.calculateFinalPrice(800, 'EUR', 23, 'DE', 'RU');
      expect(r.weight).toBe(2.5);
      expect(r.shippingCost).toBe(3525);
      // 800*101 = 80800 RUB → 800€ → excess 600€ → 600*0.15*101 = 9090
      expect(r.customsDuty).toBe(9090);
    });
  });

  describe('calculateFinalPrice (US buyer)', () => {
    it('price under $800: 0 customs', () => {
      const r = service.calculateFinalPrice(500, 'USD', 19, 'CN', 'US');
      expect(r.customsDuty).toBe(0);
      expect(r.isCrossBorder).toBe(true);
    });

    it('price above $800: 10% customs', () => {
      // $1000 → 1000*0.1*93 = 9300 RUB
      const r = service.calculateFinalPrice(1000, 'USD', 19, 'CN', 'US');
      expect(r.customsDuty).toBeGreaterThan(0);
      expect(r.customsDuty).toBe(9300);  // 1000*0.10*93
    });
  });

  describe('calculateFinalPrice (DE buyer)', () => {
    it('always charges 19% VAT regardless of price', () => {
      // €50 → 50*101 = 5050 RUB → 5050*0.19 = 960 (rounded)
      const r = service.calculateFinalPrice(50, 'EUR', 19, 'CN', 'DE');
      expect(r.customsDuty).toBeGreaterThan(0);
      expect(r.customsDuty).toBe(960);  // 5050*0.19
    });

    it('19% VAT on expensive item', () => {
      const r = service.calculateFinalPrice(500, 'EUR', 19, 'CN', 'DE');
      expect(r.customsDuty).toBe(9595);  // 50500*0.19
    });
  });

  describe('calculateFinalPrice edge cases', () => {
    it('handles zero price', () => {
      const r = service.calculateFinalPrice(0, 'USD', 19, 'CN', 'RU');
      expect(r.priceInRub).toBe(0);
      expect(r.customsDuty).toBe(0);
      expect(r.finalPrice).toBe(r.shippingCost);
    });

    it('defaults userCountry to RU when omitted', () => {
      const r = service.calculateFinalPrice(100, 'USD', 19, 'RU');
      expect(r.userCountry).toBe('RU');
      expect(r.isCrossBorder).toBe(false);
    });

    it('unknown region defaults to RU', () => {
      const r = service.calculateFinalPrice(100, 'USD', 19, 'XX', 'RU');
      expect(r.isCrossBorder).toBe(false);
    });
  });

  describe('inferUserCountry', () => {
    it('returns explicit header value', () => {
      expect(service.inferUserCountry(undefined, 'US')).toBe('US');
      expect(service.inferUserCountry(undefined, 'DE')).toBe('DE');
    });

    it('defaults to RU without header', () => {
      expect(service.inferUserCountry()).toBe('RU');
    });
  });

  describe('convert', () => {
    it('converts between currencies', () => {
      const result = service.convert(100, 'USD', 'EUR');
      expect(result).toBeCloseTo(92.08, 0);  // 100*93/101
    });
  });
});
