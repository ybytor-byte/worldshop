import { Module } from '@nestjs/common';
import { SearchByImageController } from './search-by-image.controller';
import { SearchByImageService } from './search-by-image.service';
import { SearchModule } from '../search/search.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { HermesModule } from '../hermes/hermes.module';
import { QueueModule } from '../queue/queue.module';
import { SerperLensProvider } from '../search/providers/serper-lens.provider';

@Module({
  imports: [SearchModule, CloudinaryModule, HermesModule, QueueModule],
  controllers: [SearchByImageController],
  providers: [SearchByImageService, SerperLensProvider],
  exports: [SerperLensProvider],
})
export class SearchByImageModule {}
