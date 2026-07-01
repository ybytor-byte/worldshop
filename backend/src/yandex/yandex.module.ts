import { Module } from '@nestjs/common';
import { YandexVisionService } from './yandex-vision.service';

@Module({
  providers: [YandexVisionService],
  exports: [YandexVisionService],
})
export class YandexModule {}
