import { IsString, IsOptional, IsObject, IsNumber, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngestProductDto {
  @ApiProperty({ description: 'URL of the product page' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Shop identifier (e.g. dns, ozon)' })
  @IsString()
  shop: string;

  @ApiProperty({ description: 'Product title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Raw price text from page' })
  @IsString()
  priceBlockText: string;

  @ApiProperty({ description: 'Cleaned specs/description text' })
  @IsString()
  specsText: string;

  @ApiPropertyOptional({ description: 'Optional DOM snapshot fragment' })
  @IsOptional()
  @IsString()
  rawDomSnapshot?: string;
}

export class AiProcessedDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsNumber()
  price: number;

  @IsString()
  currency: string;

  @IsObject()
  specs: Record<string, any>;
}