import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CpaService } from './cpa.service';

@ApiTags('cpa')
@Controller('cpa')
export class CpaController {
  private readonly logger = new Logger(CpaController.name);

  constructor(private cpaService: CpaService) {}

  @Post('import-xml')
  @ApiOperation({ summary: 'Import products from CPA XML feed' })
  async importXml(@Body('xml') xml: string) {
    const products = await this.cpaService.parseAdmitadXml(xml);
    return this.cpaService.importProducts(products);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import products directly as JSON array' })
  async importJson(@Body() products: any[]) {
    return this.cpaService.importProducts(products);
  }
} 