import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  describe('onModuleInit', () => {
    it('registers SerperProvider and TmapiProvider', async () => {
      await service.onModuleInit();
      const providers = (service as any).providers;
      expect(providers.length).toBe(2);
      expect(providers[0].name).toBe('serper');
      expect(providers[1].name).toBe('tmapi');
    });

    it('does NOT register YandexMarketProvider (dead provider removed)', async () => {
      await service.onModuleInit();
      const names = (service as any).providers.map((p: any) => p.name);
      expect(names).not.toContain('yandex_market');
    });
  });

  describe('searchProducts', () => {
    it('returns empty array when no providers match region', async () => {
      await service.onModuleInit();
      const result = await service.searchProducts({ text: 'test', region: 'XX' });
      expect(result).toEqual([]);
    });

    it('returns empty array on provider failure', async () => {
      const mockProvider = { name: 'mock', supportedRegions: ['RU'], supportsRegion: () => true, search: () => Promise.reject(new Error('fail')) };
      service.registerProvider(mockProvider);
      const result = await service.searchProducts({ text: 'test', region: 'RU' });
      expect(result).toEqual([]);
    });

    it('flattens results from multiple providers', async () => {
      const mockProvider = {
        name: 'mock', supportedRegions: ['RU'], supportsRegion: () => true,
        search: () => Promise.resolve([{ shop: 'TestShop', price: 100, currency: 'RUB', url: 'https://test.ru', region: 'RU' }]),
      };
      service.registerProvider(mockProvider);
      const result = await service.searchProducts({ text: 'test', region: 'RU' });
      expect(result).toHaveLength(1);
      expect(result[0].shop).toBe('TestShop');
    });
  });
});
