import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CpaService } from './cpa.service';
import { CpaController } from './cpa.controller';
import { CityAdsClient } from './cityads.client';
import { CpaSyncProcessor } from './cpa-sync.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    BullModule.registerQueue({ name: 'cpaSync' }),
  ],
  controllers: [CpaController],
  providers: [CpaService, CityAdsClient, CpaSyncProcessor],
  exports: [CpaService, CityAdsClient],
})
export class CpaModule {}