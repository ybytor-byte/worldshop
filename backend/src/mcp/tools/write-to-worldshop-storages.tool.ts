import { Injectable, Logger } from '@nestjs/common';
import { McpTool, McpToolSchema, McpToolResult } from '../mcp-protocol.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WriteToWorldshopStoragesTool implements McpTool {
  private readonly logger = new Logger(WriteToWorldshopStoragesTool.name);

  schema: McpToolSchema = {
    name: 'write_to_worldshop_storages',
    description: 'Save product, offers, and analysis results to WorldShop databases (PostgreSQL). Creates product + offers records.',
    inputSchema: {
      type: 'object',
      properties: {
        productName: { type: 'string', description: 'Product name' },
        brand: { type: 'string', description: 'Product brand (optional)' },
        model: { type: 'string', description: 'Product model (optional, defaults to productName)' },
        specs: { type: 'object', description: 'Product specifications (optional)' },
        offers: { type: 'array', description: 'Array of offers to save' },
        normalized: { type: 'array', description: 'Normalized offers with shipping/duty calculations (optional)' },
        bestDeal: { type: 'object', description: 'Best deal info (optional)' },
        category: { type: 'string', description: 'Product category', default: 'electronics' },
        deepAnalysis: { type: 'object', description: 'Full deep analysis from Hermes (optional)' },
      },
    },
  };

  constructor(private prisma: PrismaService) {}

  async execute(args: Record<string, any>): Promise<McpToolResult> {
    const { productName, brand, model, specs, offers, normalized, bestDeal, category, deepAnalysis } = args;

    if (!productName) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'productName is required' }) }],
        isError: true,
      };
    }

    const productBrand = brand || 'Unknown';
    const productModel = model || productName;
    const productSpecs = specs || {};

    if (category) productSpecs.category = category;
    if (bestDeal) productSpecs.bestDeal = bestDeal;
    if (normalized) productSpecs.normalizedCount = normalized.length;
    if (deepAnalysis) productSpecs.deepAnalysis = deepAnalysis;

    let product = await this.prisma.product.findFirst({
      where: { brand: productBrand, model: productModel },
    });

    if (product) {
      product = await this.prisma.product.update({
        where: { id: product.id },
        data: { specs: productSpecs },
      });
    } else {
      product = await this.prisma.product.create({
        data: { brand: productBrand, model: productModel, specs: productSpecs },
      });
    }

    let offersSaved = 0;
    if (offers && Array.isArray(offers)) {
      for (const o of offers) {
        await this.prisma.offer.create({
          data: {
            productId: product.id,
            shop: o.shop || 'Unknown',
            price: typeof o.price === 'number' ? o.price : 0,
            currency: o.currency || 'RUB',
            url: o.url || '',
            shippingUSD: o.shipping,
            deliveryDays: o.deliveryDays,
            region: o.region || 'RU',
          },
        });
        offersSaved++;
      }
    }

    this.logger.log(`Saved product ${product.id} with ${offersSaved} offers`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          productId: product.id,
          offersSaved,
          productName,
          brand: productBrand,
        }, null, 2),
      }],
    };
  }
}
