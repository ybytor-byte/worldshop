import { Module } from '@nestjs/common';
import { SearchByImageController } from './search-by-image.controller';
import { SearchByImageService } from './search-by-image.service';
import { HermesModule } from '../hermes/hermes.module';

@Module({
  imports: [HermesModule],
  controllers: [SearchByImageController],
  providers: [SearchByImageService],
})
export class SearchByImageModule {}