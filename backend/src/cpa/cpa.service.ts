import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CpaProduct {
  shop: string;
  brand: string;
  model: string;
  price: number;
  currency: string;
  url: string;
  affiliateUrl: string;
}

@Injectable()
export class CpaService {
  private readonly logger = new Logger(CpaService.name);

  constructor(private prisma: PrismaService) {}

  async importProducts(products: CpaProduct[]) {
    let created = 0;
    let updated = 0;

    for (const item of products) {
      const key = `${item.brand} ${item.model}`;
      let product = await this.prisma.product.findFirst({
        where: { brand: item.brand, model: item.model },
      });

      if (!product) {
        product = await this.prisma.product.create({
          data: { brand: item.brand, model: item.model, specs: {} },
        });
        created++;
      }

      const existing = await this.prisma.offer.findFirst({
        where: { productId: product.id, shop: item.shop, url: item.url },
      });

      if (!existing) {
        await this.prisma.offer.create({
          data: {
            productId: product.id,
            shop: item.shop,
            price: item.price,
            currency: item.currency,
            url: item.url,
            affiliateUrl: item.affiliateUrl,
          },
        });
        updated++;
      }
    }

    this.logger.log(`CPA import: ${created} products, ${updated} offers`);
    return { created, updated };
  }

  async parseAdmitadXml(xml: string): Promise<CpaProduct[]> {
    const results: CpaProduct[] = [];
    const productMatches = xml.matchAll(/<product[^>]*>[\s\S]*?<\/product>/g);

    for (const match of productMatches) {
      const block = match[0];
      const getName = (tag: string) => {
        const m = block.match(new RegExp(`<${tag}>([^<]*)<`));
        return m ? m[1].trim() : '';
      };

      const name = getName('name');
      const priceStr = getName('price');
      const currency = getName('currency') || 'RUB';
      const url = getName('url');
      const originalUrl = getName('originalUrl') || '';

      if (!name || !priceStr) continue;

      const price = parseFloat(priceStr);
      if (isNaN(price)) continue;

      const parts = name.split(/\s+/);
      const brand = parts[0] || name;
      const model = parts.slice(1).join(' ') || name;

      results.push({
        shop: getName('vendor') || 'Shop',
        brand,
        model,
        price,
        currency,
        url,
        affiliateUrl: originalUrl || url,
      });
    }

    return results;
  }
} 