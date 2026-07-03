import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpTool, McpToolSchema, McpToolResult } from '../mcp-protocol.service';
import { SerperLensProvider } from '../../search/providers/serper-lens.provider';
import { SearchService } from '../../search/search.service';

@Injectable()
export class FetchGlobalMarketDataTool implements McpTool {
  private readonly logger = new Logger(FetchGlobalMarketDataTool.name);

  schema: McpToolSchema = {
    name: 'fetch_global_market_data',
    description: 'Parallel search across all regions (Serper Lens + Serper Shopping + TMAPI). Identify product from image or name, find best prices globally.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'Cloudinary URL of the product image (optional if productName provided)' },
        productName: { type: 'string', description: 'Product name/keywords (optional if imageUrl provided)' },
        region: { type: 'string', description: 'Target region: RU, US, EU, ASIA', default: 'RU' },
      },
    },
  };

  constructor(
    private config: ConfigService,
    private serperLens: SerperLensProvider,
    private searchService: SearchService,
  ) {}

  async execute(args: Record<string, any>): Promise<McpToolResult> {
    const { imageUrl, productName: inputName, region } = args;
    const targetRegion = (region || 'RU').toUpperCase();

    let productName = inputName || '';
    let visualMatches: any[] = [];

    if (imageUrl && !productName) {
      const lensResults = await this.serperLens.identifyByImage(imageUrl, 'ru', 'ru');
      productName = this.serperLens.extractProductName(lensResults) || '';
      visualMatches = lensResults.map(r => ({ title: r.title, source: r.source, link: r.link, imageUrl: r.imageUrl }));
    }

    if (!productName) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'No product identified' }) }],
        isError: true,
      };
    }

    const cleanName = productName.replace(/купить.*$/i, '').replace(/с доставкой.*$/i, '').replace(/цена.*$/i, '').trim().slice(0, 120);

    const offers = await this.searchService.searchProducts({ text: cleanName, region: targetRegion });

    const filteredOffers = offers.filter((o: any) => o.price > 0 || (o.price === 0 && o.url && !o.url.includes('google.com')));

    const result = {
      productName: cleanName,
      rawProductName: productName,
      region: targetRegion,
      offers: filteredOffers,
      visualMatches,
      offerCount: filteredOffers.length,
      currency: targetRegion === 'RU' ? 'RUB' : targetRegion === 'ASIA' ? 'CNY' : 'USD',
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
}
