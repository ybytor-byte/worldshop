import { Module } from '@nestjs/common';
import { SearchByImageController } from './search-by-image.controller';
import { SearchByImageService } from './search-by-image.service';
import { SearchModule } from '../search/search.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { HermesModule } from '../hermes/hermes.module';
import { QueueModule } from '../queue/queue.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { SearchApiLensProvider } from '../search/providers/searchapi-lens.provider';

@Module({
  imports: [SearchModule, CloudinaryModule, HermesModule, QueueModule, LogisticsModule],
  controllers: [SearchByImageController],
  providers: [SearchByImageService, SearchApiLensProvider],
  exports: [SearchApiLensProvider],
})
export class SearchByImageModule {}
