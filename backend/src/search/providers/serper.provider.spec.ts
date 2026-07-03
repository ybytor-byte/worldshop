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
      expect(results[0].shipping).toBe(500);
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
  });
});
