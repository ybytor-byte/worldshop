import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CityAdsClient, CityAdsFeedProduct } from './cityads.client';

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'CITYADS_CLIENT_ID') return 'test-client-id';
    if (key === 'CITYADS_CLIENT_SECRET') return 'test-client-secret';
    return null;
  }),
};

const mockTokenResponse = {
  access_token: 'test-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
};

const mockFeedResponse = {
  products: [
    {
      id: '1',
      name: 'iPhone 16 Pro',
      price: '999.00',
      currency: 'USD',
      url: 'https://shop.com/iphone',
      originalUrl: 'https://track.cityads.com/iphone',
      vendor: 'TestShop',
      category: 'Electronics',
      image: 'https://shop.com/iphone.jpg',
      description: 'Latest iPhone',
      availability: 'in_stock',
      brand: 'Apple',
      model: 'iPhone 16 Pro',
      sku: 'IP16P-256',
    },
  ],
  updated_at: '2026-06-30T10:00:00Z',
  total: 1,
};

function mockFetchOnce(data: any, status = 200) {
  return jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  } as Response);
}

describe('CityAdsClient', () => {
  let client: CityAdsClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityAdsClient,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    client = module.get<CityAdsClient>(CityAdsClient);
  });

  describe('getAllFeeds', () => {
    it('should return a list of feeds', async () => {
      const mockFeeds = [
        { id: 'feed_1', name: 'Electronics RU', status: 'active' },
        { id: 'feed_2', name: 'Fashion RU', status: 'active' },
      ];

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFeeds),
        } as Response);

      const result = await client.getAllFeeds();
      expect(result).toEqual(mockFeeds);
      expect(result).toHaveLength(2);
    });
  });

  describe('getFeed', () => {
    it('should fetch and return feed products', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFeedResponse),
        } as Response);
      global.fetch = mockFetch;

      const result = await client.getFeed('feed_1');
      expect(result).toEqual(mockFeedResponse);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('iPhone 16 Pro');
    });

    it('should refresh token on 401', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized'),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFeedResponse),
        } as Response);
      global.fetch = mockFetch;

      const result = await client.getFeed('feed_1');
      expect(result).toEqual(mockFeedResponse);
    });

    it('should handle API errors', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        } as Response);
      global.fetch = mockFetch;

      await expect(client.getFeed('feed_1')).rejects.toThrow('CityAds API error: 500 Internal Server Error');
    });
  });

  describe('transformProduct', () => {
    it('should transform a CityAds feed product to CpaProduct format', () => {
      const product: CityAdsFeedProduct = {
        id: '123',
        name: 'Samsung Galaxy S25 Ultra',
        price: '1299.00',
        currency: 'USD',
        url: 'https://shop.com/galaxy',
        originalUrl: 'https://track.cityads.com/galaxy',
        vendor: 'Samsung Official',
        category: 'Smartphones',
        image: 'https://shop.com/galaxy.jpg',
        description: 'Latest Samsung flagship',
        availability: 'in_stock',
        brand: 'Samsung',
        model: 'Galaxy S25 Ultra',
        sku: 'SM-S938B',
      };

      const result = client.transformProduct(product);
      expect(result).toEqual({
        shop: 'Samsung Official',
        brand: 'Samsung',
        model: 'Galaxy S25 Ultra',
        price: 1299,
        currency: 'USD',
        url: 'https://shop.com/galaxy',
        affiliateUrl: 'https://track.cityads.com/galaxy',
      });
    });

    it('should handle missing brand and model', () => {
      const product: CityAdsFeedProduct = {
        id: '456',
        name: 'Sony WH-1000XM6',
        price: '349.99',
        currency: 'EUR',
        url: 'https://shop.com/sony',
        originalUrl: '',
        vendor: 'TechStore',
        category: 'Headphones',
        image: '',
        description: '',
        availability: 'in_stock',
        brand: '',
        model: '',
        sku: '',
      };

      const result = client.transformProduct(product);
      expect(result.brand).toBe('Sony');
      expect(result.model).toBe('WH-1000XM6');
      expect(result.affiliateUrl).toBe(result.url);
    });
  });
});
