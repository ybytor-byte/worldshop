import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { CityAdsClient } from '../src/cpa/cityads.client';

jest.mock('meilisearch', () => ({
  Meilisearch: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      updateSettings: jest.fn().mockResolvedValue({}),
      addDocuments: jest.fn().mockResolvedValue({}),
      search: jest.fn().mockResolvedValue({ hits: [] }),
    }),
  })),
}));

jest.mock('@nestjs/bullmq', () => {
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  };
  return {
    BullModule: {
      forRoot: jest.fn().mockReturnValue({ module: class {}, providers: [], exports: [] }),
      forRootAsync: jest.fn().mockReturnValue({ module: class {}, providers: [], exports: [] }),
      registerQueue: jest.fn().mockImplementation((config: any) => ({
        module: class {},
        providers: [{ provide: `BullQueue_${config.name}`, useValue: mockQueue }],
        exports: [{ provide: `BullQueue_${config.name}`, useValue: mockQueue }],
      })),
    },
    InjectQueue: (name: string) => (target: any, key: string | symbol, index?: number) => {
      const { Inject } = require('@nestjs/common');
      return Inject(`BullQueue_${name}`)(target, key, index);
    },
    Processor: () => (target: any) => target,
    WorkerHost: class { async onModuleInit() {} async onModuleDestroy() {} },
    getQueueToken: (name: string) => `BullQueue_${name}`,
  };
});

jest.mock('bullmq', () => ({
  Queue: jest.fn(),
  Worker: jest.fn(),
}));

describe('CPA (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: any;
  let mockCityAds: any;

  beforeAll(async () => {
    mockPrisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'mock-prod-1' }),
      },
      offer: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'mock-offer-1' }),
      },
    };

    mockCityAds = {
      getAllFeeds: jest.fn().mockResolvedValue([]),
      getFeed: jest.fn().mockResolvedValue({ products: [], updated_at: '', total: 0 }),
      transformProduct: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(CityAdsClient)
      .useValue(mockCityAds)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /cpa/import-xml', () => {
    it('should import products from Admitad XML', () => {
      return request(app.getHttpServer())
        .post('/cpa/import-xml')
        .send({ xml: '<products></products>' })
        .expect(201);
    });
  });

  describe('POST /cpa/import', () => {
    it('should import products from JSON', () => {
      return request(app.getHttpServer())
        .post('/cpa/import')
        .send([{ shop: 'Test', brand: 'B', model: 'M', price: 100, currency: 'RUB', url: 'https://x.com', affiliateUrl: 'https://x.com' }])
        .expect(201);
    });
  });

  describe('GET /cpa/cityads/feeds', () => {
    it('should return available feeds', () => {
      return request(app.getHttpServer())
        .get('/cpa/cityads/feeds')
        .expect(200)
        .expect([]);
    });
  });
});
