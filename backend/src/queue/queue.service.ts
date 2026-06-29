import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SearchService } from '../search/search.service';
import { AiProductResult } from './dto/queue.dto';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('productProcessing') private productQueue: Queue,
    private prisma: PrismaService,
    private aiService: AiService,
    private searchService: SearchService,
  ) {}

  async addToQueue(scanId: string, payload: { url: string; shop: string; title: string; priceBlockText: string; specsText: string; rawDomSnapshot?: string }) {
    await this.productQueue.add('process-product', { scanId, payload });
    this.logger.log(`Added scan ${scanId} to processing queue`);
  }

  async processProduct(scanId: string, payload: any) {
    this.logger.log(`Processing scan ${scanId}`);
    await this.prisma.productScan.update({
      where: { id: scanId },
      data: { status: 'PROCESSING' },
    });

    let aiResult: AiProductResult;

    try {
      aiResult = await this.aiService.extractProduct(payload);
    } catch (error: any) {
      this.logger.error(`AI extraction failed for scan ${scanId}: ${error.message}`);
      await this.prisma.productScan.update({
        where: { id: scanId },
        data: { status: 'FAILED', error: `AI extraction failed: ${error.message}` },
      });
      return;
    }

    try {
      const match = await this.searchService.findMatch(aiResult.brand, aiResult.model);

      if (match) {
        await this.prisma.offer.create({
          data: {
            productId: match.id,
            shop: payload.shop,
            price: aiResult.price,
            currency: aiResult.currency,
            url: payload.url,
          },
        });
        await this.prisma.productScan.update({
          where: { id: scanId },
          data: { status: 'COMPLETED', productId: match.id },
        });
        this.logger.log(`Linked offer to existing product ${match.id}`);
      } else {
        const product = await this.prisma.product.create({
          data: {
            brand: aiResult.brand,
            model: aiResult.model,
            specs: aiResult.specs,
            offers: {
              create: {
                shop: payload.shop,
                price: aiResult.price,
                currency: aiResult.currency,
                url: payload.url,
              },
            },
          },
        });
        await this.searchService.indexProduct({
          id: product.id,
          brand: aiResult.brand,
          model: aiResult.model,
          specs: Object.keys(aiResult.specs).join(' '),
        });
        await this.prisma.productScan.update({
          where: { id: scanId },
          data: { status: 'COMPLETED', productId: product.id },
        });
        this.logger.log(`Created new product ${product.id}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to save product for scan ${scanId}: ${error.message}`);
      await this.prisma.productScan.update({
        where: { id: scanId },
        data: { status: 'FAILED', error: `Save failed: ${error.message}` },
      });
    }
  }
}