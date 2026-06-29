import {
  Controller, Post, Get, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScansService } from './scans.service';
import { IngestProductDto } from './dto/scan.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('scans')
@Controller('products')
export class ScansController {
  constructor(private scansService: ScansService) {}

  @Post('ingest')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ingest a product from browser extension' })
  async ingest(
    @CurrentUser() user: { id: string },
    @Body() dto: IngestProductDto,
  ) {
    const scan = await this.scansService.createIngest(user.id, dto);
    return { id: scan.id, status: scan.status, message: 'Product sent for processing' };
  }

  @Get('ingests/my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user scan history' })
  async myScans(@CurrentUser() user: { id: string }) {
    return this.scansService.findByUser(user.id);
  }
}