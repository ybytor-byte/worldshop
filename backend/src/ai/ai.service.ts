import { Injectable, Logger } from '@nestjs/common';
import { HermesService } from '../hermes/hermes.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private hermesService: HermesService) {}

  async extractProduct(payload: {
    title: string;
    priceBlockText: string;
    specsText: string;
    shop: string;
    rawDomSnapshot?: string;
    imageUrl?: string;
  }): Promise<any> {
    this.logger.log(`Extracting product via Hermes: ${payload.title}`);
    return this.hermesService.extractProduct(payload);
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    return this.hermesService.analyzeImage(imageBase64, prompt);
  }

  async searchProduct(query: string): Promise<any[]> {
    return this.hermesService.searchProduct(query);
  }
}