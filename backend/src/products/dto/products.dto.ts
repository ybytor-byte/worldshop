import { IsString, IsNumber, IsObject, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsNumber()
  price: number;

  @IsString()
  currency: string;

  @IsString()
  shop: string;

  @IsString()
  url: string;

  @IsObject()
  specs: Record<string, any>;

  @IsOptional()
  @IsString()
  affiliateUrl?: string;
}

export class SearchProductsDto {
  @IsString()
  search: string;
}