import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SerperProvider } from './serper.provider';

const mockConfig = (key: string) => {
  if (key === 'SERPER_KEY') return 'test-serper-key';
  return undefined;
};

describe('SerperProvider', () => {
  let provider: SerperProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerperProvider,
        { provide: ConfigService, useValue: { get: mockConfig } },
      ],
    }).compile();

    provider = module.get<SerperProvider>(SerperProvider);
  });

  describe('regionConfig', () => {
    it('maps US to us', () => {
      expect(provider.supportsRegion('US')).toBe(true);
    });

    it('maps EU to de', () => {
      expect(provider.supportsRegion('EU')).toBe(true);
    });

    it('maps ASIA to jp', () => {
      expect(provider.supportsRegion('ASIA')).toBe(true);
    });

    it('maps RU to ru', () => {
      expect(provider.supportsRegion('RU')).toBe(true);
    });

    it('does NOT support unknown regions', () => {
      expect(provider.supportsRegion('XX')).toBe(false);
      expect(provider.supportsRegion('AFRICA')).toBe(false);
    });
  });

  describe('search', () => {
    const mockApiResponse = {
      shopping: [
        { title: 'Test Product', source: 'TestStore', price: { amount: 9990, currency: 'RUB' }, link: 'https://teststore.ru/p/123', shipping: 500 },
      ],
    };

    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      } as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns search offers with correct fields', async () => {
      const results = await provider.search({ text: 'iPhone 16', region: 'RU' });
      expect(results).toHaveLength(1);
      expect(results[0].shop).toBe('TestStore');
      expect(results[0].price).toBe(9990);
      expect(results[0].currency).toBe('RUB');
      expect(results[0].region).toBe('RU');
      expect(results[0].url).toBe('https://teststore.ru/p/123');
    });

    it('calls serper.dev API with correct region param', async () => {
      await provider.search({ text: 'test', region: 'EU' });
      expect(fetch).toHaveBeenCalledWith(
        'https://google.serper.dev/shopping',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'X-API-KEY': 'test-serper-key' }),
          body: expect.stringContaining('"gl":"de"'),
        }),
      );
    });

    it('handles empty API response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);
      const results = await provider.search({ text: 'nothing', region: 'RU' });
      expect(results).toEqual([]);
    });

    it('handles API failure gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      const results = await provider.search({ text: 'test', region: 'RU' });
      expect(results).toEqual([]);
    });

    it('ignores organic results — only uses shopping', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [],
          organic: [
            { title: 'iPhone 16', source: 'SomeBlog', price: 'от 455 ₽/мес', link: 'https://blog.ru/post' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'iPhone', region: 'RU' });
      expect(results).toEqual([]);
    });

    it('skips items with zero price', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Free Item', source: 'Shop', price: { amount: 0, currency: 'RUB' }, link: 'https://shop.ru/free' },
            { title: 'Paid Item', source: 'Shop2', price: { amount: 500, currency: 'RUB' }, link: 'https://shop2.ru/paid' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'test', region: 'RU' });
      expect(results).toHaveLength(1);
      expect(results[0].price).toBe(500);
    });

    it('uses the real product URL from API, not generated Ozon search', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Nike Shoes', source: 'Nike', price: { amount: 8990, currency: 'RUB' }, link: 'https://www.nike.com/air-max' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'Nike Air Max', region: 'RU' });
      expect(results[0].url).toBe('https://www.nike.com/air-max');
    });

    it('parses price as plain number (not object)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'MacBook', source: 'Apple', price: 129900, link: 'https://apple.com/macbook' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'MacBook', region: 'US' });
      expect(results).toHaveLength(1);
      expect(results[0].price).toBe(129900);
      expect(results[0].currency).toBe('USD');
    });

    it('parses price as string with currency symbol', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Samsung TV', source: 'MediaMarkt', price: '799,99 €', link: 'https://mediamarkt.de/tv' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'Samsung TV', region: 'EU' });
      expect(results).toHaveLength(1);
      expect(results[0].price).toBe(799.99);
      expect(results[0].currency).toBe('EUR');
    });

    it('returns offers for multiple regions with correct currencies', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'iPhone 15', source: 'Best Buy', price: { amount: 899, currency: 'USD' }, link: 'https://bestbuy.com/iphone' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'iPhone 15', region: 'US' });
      expect(results[0].currency).toBe('USD');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'iPhone 15', source: 'Yamada Denki', price: { amount: 149800, currency: 'JPY' }, link: 'https://yamada-denki.jp/iphone' },
          ],
        }),
      } as any);
      const resultsAsia = await provider.search({ text: 'iPhone 15', region: 'ASIA' });
      expect(resultsAsia[0].currency).toBe('JPY');
    });

    it('extracts real URL from Google /url?q= redirect', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Phone', source: 'Store', price: 100, link: 'https://www.google.com/url?q=https://realstore.com/product&sa=U&ved=0ahUKEwi1' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'phone', region: 'US' });
      expect(results[0].url).toBe('https://realstore.com/product');
    });

    it('extracts real URL from Google /url?url= redirect', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Laptop', source: 'Shop', price: 500, link: 'https://google.com/url?url=https://example.com/laptop&rct=j' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'laptop', region: 'US' });
      expect(results[0].url).toBe('https://example.com/laptop');
    });

    it('extracts adurl from Google /aclk ads', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Ad Product', source: 'AdStore', price: 200, link: 'https://www.google.com/aclk?sa=L&adurl=https://adstore.com/prod&ctype=2' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'ad', region: 'US' });
      expect(results[0].url).toBe('https://adstore.com/prod');
    });

    it('discards Google Shopping product page URLs', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Product', source: 'Google Shop', price: 300, link: 'https://www.google.com/shopping/product/12345' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'product', region: 'US' });
      expect(results[0].url).toBe('');
    });

    it('falls back to item.url when link field is missing', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Test', source: 'Store', price: 100, url: 'https://store.com/item', merchant_link: 'https://merchant.com/item' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'test', region: 'RU' });
      expect(results[0].url).toBe('https://store.com/item');
    });

    it('returns empty URL when no link field is present', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Item', source: 'Shop', price: { amount: 100, currency: 'USD' } },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'item', region: 'US' });
      expect(results[0].url).toBe('');
    });

    it('handles googlesyndication.com URLs', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          shopping: [
            { title: 'Ad', source: 'AdNetwork', price: 50, link: 'https://googleads.g.doubleclick.net/aclk?adurl=https://real.com/prod' },
          ],
        }),
      } as any);
      const results = await provider.search({ text: 'ad', region: 'US' });
      expect(results[0].url).toBe('https://real.com/prod');
    });
  });
});
