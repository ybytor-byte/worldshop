import { Module } from '@nestjs/common';
import { ApiShipService } from './apiship.service';

@Module({
  providers: [ApiShipService],
  exports: [ApiShipService],
})
export class LogisticsModule {}
