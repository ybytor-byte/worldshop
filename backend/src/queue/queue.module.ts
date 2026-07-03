import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueProcessor } from './queue.processor';
import { HermesQueueService } from './hermes-queue.service';
import { AiModule } from '../ai/ai.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'productProcessing' }),
    BullModule.registerQueue({ name: 'hermes-processing' }),
    AiModule,
    SearchModule,
  ],
  providers: [QueueService, QueueProcessor, HermesQueueService],
  exports: [QueueService, HermesQueueService, BullModule],
})
export class QueueModule {}