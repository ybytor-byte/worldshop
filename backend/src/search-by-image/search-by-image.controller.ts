import {
  Controller, Post, Get, Param, UploadedFile, UseInterceptors, BadRequestException, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SearchByImageService } from './search-by-image.service';
import { HermesQueueService } from '../queue/hermes-queue.service';

@ApiTags('search')
@Controller('search-by-image')
export class SearchByImageController {
  constructor(
    private service: SearchByImageService,
    private hermesQueue: HermesQueueService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Search products by image upload → Cloudinary → Serper Lens → Shopping' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        region: { type: 'string', default: 'RU' },
      },
    },
  })
  async searchByImage(@UploadedFile() file: Express.Multer.File, @Body('region') region?: string) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    try {
      return await this.service.searchByImageUpload(file.buffer, file.mimetype, region || 'RU');
    } catch (err: any) {
      const query = `товар ${Date.now()}`;
      const fallback = await this.service.searchByKeywords([query], region || 'RU');
      return {
        identified: false,
        message: `Ошибка: ${err?.message || 'неизвестная'}`,
        offers: fallback.offers,
      };
    }
  }

  @Post('keywords')
  @ApiOperation({ summary: 'Search by extracted keywords (no image upload)' })
  async searchByKeywords(@Body() body: { keywords: string[]; region?: string }) {
    return this.service.searchByKeywords(body.keywords || [], body.region || 'RU');
  }

  @Get('hermes/status/:jobId')
  @ApiOperation({ summary: 'Check Hermes deep processing job status' })
  async checkHermesStatus(@Param('jobId') jobId: string) {
    const status = await this.hermesQueue.getJobStatus(jobId);
    return { jobId, status };
  }
}
