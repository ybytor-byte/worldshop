import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

// Mock meilisearch to prevent ESM parsing syntax error in Jest
jest.mock('meilisearch', () => {
  return {
    Meilisearch: jest.fn().mockImplementation(() => {
      return {
        index: jest.fn().mockReturnValue({
          updateSettings: jest.fn().mockResolvedValue({}),
          addDocuments: jest.fn().mockResolvedValue({}),
          search: jest.fn().mockResolvedValue({ hits: [] }),
        }),
      };
    }),
  };
});

// Mock @nestjs/bullmq to completely bypass Redis connections in e2e tests
jest.mock('@nestjs/bullmq', () => {
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  };
  return {
    BullModule: {
      forRoot: jest.fn().mockReturnValue({
        module: class {},
        providers: [],
        exports: [],
      }),
      forRootAsync: jest.fn().mockReturnValue({
        module: class {},
        providers: [],
        exports: [],
      }),
      registerQueue: jest.fn().mockImplementation((config: any) => ({
        module: class {},
        providers: [
          {
            provide: `BullQueue_${config.name}`,
            useValue: mockQueue,
          },
        ],
        exports: [
          {
            provide: `BullQueue_${config.name}`,
            useValue: mockQueue,
          },
        ],
      })),
    },
    InjectQueue:
      (name: string) => (target: any, key: string | symbol, index?: number) => {
        const { Inject } = require('@nestjs/common');
        return Inject(`BullQueue_${name}`)(target, key, index);
      },
    Processor: () => (target: any) => target,
    WorkerHost: class {
      async onModuleInit() {}
      async onModuleDestroy() {}
    },
    getQueueToken: (name: string) => `BullQueue_${name}`,
  };
});

jest.mock('bullmq', () => {
  return {
    Queue: jest.fn(),
    Worker: jest.fn(),
  };
});

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const mockPrisma = {
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'user-id', email: 'test@example.com' }),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    price: {
      create: jest.fn(),
    },
    rawIngest: {
      create: jest.fn(),
      update: jest.fn(),
    },
    affiliateNetwork: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(getQueueToken('productProcessingQueue'))
      .useValue(mockQueue)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
