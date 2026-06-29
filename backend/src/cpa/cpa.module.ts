import { Module } from '@nestjs/common';
import { CpaService } from './cpa.service';
import { CpaController } from './cpa.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CpaController],
  providers: [CpaService],
  exports: [CpaService],
})
export class CpaModule {} 