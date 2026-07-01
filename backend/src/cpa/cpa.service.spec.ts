import { Test, TestingModule } from '@nestjs/testing';
import { CpaService } from './cpa.service';
import { CityAdsClient } from './cityads.client';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  product: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  offer: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockCityAdsClient = {
  getFeed: jest.fn(),
  getAllFeeds: jest.fn(),
  transformProduct: jest.fn(),
};

describe('CpaService', () => {
  let service: CpaService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CpaService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CityAdsClient, useValue: mockCityAdsClient },
      ],
    }).compile();

    service = module.get<CpaService>(CpaService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('importProducts', () => {
    it('should create new product and offer', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue({ id: 'new-prod-1' });
      mockPrisma.offer.findFirst.mockResolvedValue(null);
      mockPrisma.offer.create.mockResolvedValue({ id: 'new-offer-1' });

      const products = [{
        shop: 'TestShop',
        brand: 'Apple',
        model: 'iPhone 16',
        price: 999,
        currency: 'USD',
        url: 'https://shop.com/iphone',
        affiliateUrl: 'https://track.com/iphone',
      }];

      const result = await service.importProducts(products);
      expect(result).toEqual({ created: 1, updated: 1 });
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: { brand: 'Apple', model: 'iPhone 16', specs: {} },
      });
    });

    it('should link offer to existing product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'exist-prod-1' });
      mockPrisma.offer.findFirst.mockResolvedValue(null);
      mockPrisma.offer.create.mockResolvedValue({ id: 'new-offer-2' });

      const products = [{
        shop: 'AnotherShop',
        brand: 'Apple',
        model: 'iPhone 16',
        price: 1099,
        currency: 'USD',
        url: 'https://shop2.com/iphone',
        affiliateUrl: 'https://track2.com/iphone',
      }];

      const result = await service.importProducts(products);
      expect(result).toEqual({ created: 0, updated: 1 });
      expect(mockPrisma.product.create).not.toHaveBeenCalled();
    });

    it('should skip duplicate offers (same shop+url)', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'exist-prod-1' });
      mockPrisma.offer.findFirst.mockResolvedValue({ id: 'exist-offer-1' });

      const products = [{
        shop: 'TestShop',
        brand: 'Apple',
        model: 'iPhone 16',
        price: 999,
        currency: 'USD',
        url: 'https://shop.com/iphone',
        affiliateUrl: 'https://track.com/iphone',
      }];

      const result = await service.importProducts(products);
      expect(result).toEqual({ created: 0, updated: 0 });
      expect(mockPrisma.offer.create).not.toHaveBeenCalled();
    });
  });

  describe('syncCityAdsFeed', () => {
    it('should sync feed and import products', async () => {
      const feedProducts = [
        { id: '1', name: 'Test Product', price: '100', currency: 'RUB',
          url: 'https://shop.com/p', originalUrl: 'https://track.com/p',
          vendor: 'Shop', category: '', image: '', description: '',
          availability: '', brand: 'TestBrand', model: 'TestModel', sku: '' },
      ];

      const mockResponse = { products: feedProducts, updated_at: '', total: 1 };
      mockCityAdsClient.getFeed.mockResolvedValue(mockResponse);
      mockCityAdsClient.transformProduct.mockImplementation((p: any) => ({
        shop: p.vendor,
        brand: p.brand || 'Unknown',
        model: p.model || p.name,
        price: parseFloat(p.price),
        currency: p.currency,
        url: p.url,
        affiliateUrl: p.originalUrl || p.url,
      }));

      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue({ id: 'new-prod' });
      mockPrisma.offer.findFirst.mockResolvedValue(null);
      mockPrisma.offer.create.mockResolvedValue({ id: 'new-offer' });

      const result = await service.syncCityAdsFeed('feed_1');
      expect(result.imported).toBeGreaterThan(0);
      expect(mockCityAdsClient.getFeed).toHaveBeenCalledWith('feed_1', {
        limit: 1000,
        offset: 0,
        updated_since: undefined,
      });
    });

    it('should handle feed sync errors', async () => {
      mockCityAdsClient.getFeed.mockRejectedValue(new Error('API error'));

      await expect(service.syncCityAdsFeed('bad_feed')).rejects.toThrow('API error');
    });
  });

  describe('parseAdmitadXml', () => {
    it('should parse Admitad XML products', async () => {
      const xml = `<?xml version="1.0"?>
        <products>
          <product>
            <name>Samsung Galaxy S25</name>
            <price>799.99</price>
            <currency>USD</currency>
            <url>https://admitad.com/go/samsung</url>
            <originalUrl>https://shop.com/samsung</originalUrl>
            <vendor>SamsungStore</vendor>
          </product>
          <product>
            <name>Xiaomi Redmi Note 14</name>
            <price>299.00</price>
            <currency>EUR</currency>
            <url>https://admitad.com/go/xiaomi</url>
            <vendor>XiaomiShop</vendor>
          </product>
        </products>`;

      const result = await service.parseAdmitadXml(xml);
      expect(result).toHaveLength(2);
      expect(result[0].brand).toBe('Samsung');
      expect(result[0].price).toBe(799.99);
      expect(result[1].brand).toBe('Xiaomi');
      expect(result[1].affiliateUrl).toBe(result[1].url);
    });

    it('should handle malformed XML', async () => {
      const result = await service.parseAdmitadXml('<notproducts><foo></foo></notproducts>');
      expect(result).toHaveLength(0);
    });
  });

  describe('getCityAdsFeeds', () => {
    it('should return available feeds', async () => {
      const mockFeeds = [{ id: 'feed_1', name: 'Electronics' }];
      mockCityAdsClient.getAllFeeds.mockResolvedValue(mockFeeds);

      const result = await service.getCityAdsFeeds();
      expect(result).toEqual(mockFeeds);
    });
  });
});
