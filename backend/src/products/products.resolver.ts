import { Resolver, Query, Args } from '@nestjs/graphql';
import { ProductsService } from './products.service';

@Resolver('Product')
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query('product')
  async getProduct(@Args('id') id: string) {
    return this.productsService.findById(id);
  }

  @Query('products')
  async searchProducts(@Args('search') search: string) {
    return this.productsService.search(search);
  }
}