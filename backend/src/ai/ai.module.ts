import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { HermesModule } from '../hermes/hermes.module';

@Module({
  imports: [HermesModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}