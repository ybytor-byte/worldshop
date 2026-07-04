import { Controller, Post, Get, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpGuard } from './mcp.guard';
import { SearchApiLensProvider } from '../search/providers/searchapi-lens.provider';
import { SerperProvider } from '../search/providers/serper.provider';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('mcp')
@UseGuards(McpGuard)
export class McpController {
  constructor(
    private config: ConfigService,
    private searchApiLens: SearchApiLensProvider,
    private serper: SerperProvider,
    private cloudinary: CloudinaryService,
    private prisma: PrismaService,
  ) {}

  @Post('searchapi-lens')
  async searchApiLensSearch(@Body() body: { imageUrl: string }) {
    if (!body.imageUrl) throw new BadRequestException('imageUrl required');
    const results = await this.searchApiLens.identifyByImage(body.imageUrl, 'ru', 'ru');
    const productName = this.searchApiLens.extractProductName(results);
    return {
      productName,
      visualMatches: results.map(r => ({ title: r.title, source: r.source, link: r.link, imageUrl: r.imageUrl })),
    };
  }

  @Post('serper-shopping')
  async serperShoppingSearch(@Body() body: { query: string; region?: string }) {
    if (!body.query) throw new BadRequestException('query required');
    const offers = await this.serper.search({ text: body.query, region: body.region || 'RU' });

    const storeDomains: Record<string, (q: string) => string> = {
      'ozon': (q) => `https://www.ozon.ru/search/?text=${q}&from_global=true`,
      'wildberries': (q) => `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}`,
      'yandex': (q) => `https://market.yandex.ru/search?text=${q}`,
      'dns': (q) => `https://www.dns-shop.ru/search/?q=${q}`,
      'mvideo': (q) => `https://www.mvideo.ru/search?q=${q}`,
      'citilink': (q) => `https://www.citilink.ru/search/?text=${q}`,
      'regard': (q) => `https://www.regard.ru/search?q=${q}`,
      'eldorado': (q) => `https://eldorado.ru/search/?q=${q}`,
      'aliexpress': (q) => `https://aliexpress.ru/wholesale?SearchText=${q}`,
      'biggeek': (q) => `https://biggeek.ru/catalog?q=${q}`,
      'mobilo4ka': (q) => `https://mobilo4ka.ru/search?q=${q}`,
      'apple-com': (q) => `https://apple-com.ru/search?q=${q}`,
      'ipac': (q) => `https://ipac67.ru/search?q=${q}`,
      'walmart': (q) => `https://www.walmart.com/search?q=${q}`,
      'ebay': (q) => `https://www.ebay.com/sch/i.html?_nkw=${q}`,
      'bestbuy': (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,
      'mediamarkt': (q) => `https://www.mediamarkt.de/search?query=${q}`,
    };

    const q = encodeURIComponent(body.query.replace(/[^a-zA-Zа-яёА-ЯЁ0-9\s\-]/g, '').trim().slice(0, 120));

    const region = (body.region || 'RU').toUpperCase();
    const fallbackStore: Record<string, string> = {
      RU: `https://www.ozon.ru/search/?text=${q}&from_global=true`,
      US: `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,
      EU: `https://www.mediamarkt.de/search?query=${q}`,
      ASIA: `https://aliexpress.ru/wholesale?SearchText=${q}`,
    };

    return offers.map(o => {
      const shopLower = (o.shop || '').toLowerCase();
      for (const [key, builder] of Object.entries(storeDomains)) {
        if (shopLower.includes(key)) {
          return { ...o, url: builder(q) };
        }
      }
      if (!o.url || o.url.includes('google.com')) {
        return { ...o, url: fallbackStore[region] || fallbackStore['RU'] };
      }
      return o;
    });
  }

  @Post('cloudinary-upload')
  async cloudinaryUpload(@Body() body: { imageBase64: string }) {
    if (!body.imageBase64) throw new BadRequestException('imageBase64 required');
    const buffer = Buffer.from(body.imageBase64, 'base64');
    const url = await this.cloudinary.uploadImage(buffer);
    return { url };
  }

  @Post('save-product')
  async saveProduct(@Body() body: {
    productName: string;
    brand?: string;
    model?: string;
    specs?: Record<string, any>;
    offers: Array<{
      shop: string;
      price: number;
      currency: string;
      url: string;
      shipping?: number;
      deliveryDays?: string;
      region?: string;
    }>;
  }) {
    const brand = body.brand || 'Unknown';
    const model = body.model || body.productName;

    let product = await this.prisma.product.findFirst({
      where: { brand, model },
    });

    if (product) {
      product = await this.prisma.product.update({
        where: { id: product.id },
        data: { specs: body.specs || {} },
      });
    } else {
      product = await this.prisma.product.create({
        data: { brand, model, specs: body.specs || {} },
      });
    }

    for (const o of body.offers) {
      await this.prisma.offer.create({
        data: {
          productId: product.id,
          shop: o.shop,
          price: o.price,
          currency: o.currency,
          url: o.url,
          shippingUSD: o.shipping,
          deliveryDays: o.deliveryDays,
          region: o.region || 'RU',
        },
      });
    }

    return { productId: product.id };
  }

  @Get('price-history/:id')
  async priceHistory(@Param('id') id: string) {
    const offers = await this.prisma.offer.findMany({
      where: { productId: id },
      orderBy: { scrapedAt: 'desc' },
      take: 100,
      select: { scrapedAt: true, price: true, shop: true, currency: true },
    });
    return offers;
  }
}
