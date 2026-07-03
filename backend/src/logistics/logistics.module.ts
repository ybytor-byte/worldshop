import { Module } from '@nestjs/common';
import { ApiShipService } from './apiship.service';
import { PriceCalculatorService } from './price-calculator.service';

@Module({
  providers: [ApiShipService, PriceCalculatorService],
  exports: [ApiShipService, PriceCalculatorService],
})
export class LogisticsModule {}
