import { IsString, IsNumber, IsObject } from 'class-validator';

export class AiExtractDto {
  @IsString()
  title: string;

  @IsString()
  priceBlockText: string;

  @IsString()
  specsText: string;

  @IsString()
  shop: string;

  rawDomSnapshot?: string;
}

export class AiProductResultDto {
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