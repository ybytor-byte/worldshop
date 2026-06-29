import {
  Controller, Post, UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SearchByImageService } from './search-by-image.service';

@ApiTags('search')
@Controller('search-by-image')
export class SearchByImageController {
  constructor(private service: SearchByImageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Search products by image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async searchByImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    try {
      const base64 = file.buffer.toString('base64');
      const product = await this.service.identifyProduct(base64);

      if (!product.brand && !product.model) {
        return {
          identified: false,
          message: 'Не удалось распознать товар на фото',
          shops: [],
        };
      }

      const query = `${product.brand} ${product.model}`.trim();
      const shops = this.service.getShopLinks(query);

      return {
        identified: true,
        brand: product.brand,
        model: product.model,
        description: product.description,
        query,
        shops,
      };
    } catch (err: any) {
      return {
        identified: false,
        message: `Ошибка ИИ: ${err?.message || 'неизвестная'}`,
        shops: [],
      };
    }
  }
}