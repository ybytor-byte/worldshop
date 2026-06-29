import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { SearchProductsDto } from './dto/products.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Search products by brand/model' })
  @ApiResponse({ status: 200, description: 'List of matching products' })
  async search(@Query() query: SearchProductsDto) {
    return this.productsService.search(query.search);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all products' })
  async getAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get(':id/offers')
  @ApiOperation({ summary: 'Get all offers for a product' })
  async getOffers(@Param('id') id: string) {
    return this.productsService.getOffers(id);
  }
}