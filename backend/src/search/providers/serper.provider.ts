import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchProvider, SearchOffer, SearchQuery } from '../interfaces/search-provider.interface';

@Injectable()
export class SerperProvider implements SearchProvider {
  readonly name = 'serper';
  readonly supportedRegions = ['US', 'EU', 'ASIA', 'RU'];
  private readonly apiKey: string;
  private readonly logger = new Logger(SerperProvider.name);
  private readonly baseUrl = 'https://google.serper.dev/shopping';

  private readonly regionConfig: Record<string, string> = {
    US: 'us',
    EU: 'de',
    ASIA: 'jp',
    RU: 'ru',
  };

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('SERPER_KEY') || '';
  }

  supportsRegion(region: string): boolean {
    return this.supportedRegions.includes(region.toUpperCase());
  }

  async search(query: SearchQuery): Promise<SearchOffer[]> {
    if (!this.apiKey) {
      this.logger.warn('Serper API key not configured');
      return this.fallbackSearch(query);
    }

    const gl = this.regionConfig[query.region.toUpperCase()];
    if (!gl) return [];

    try {
      const body: Record<string, any> = { q: query.text, gl };
      if (query.limit) body.num = query.limit;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        this.logger.warn(`Serper API returned ${response.status}`);
        return this.fallbackSearch(query);
      }

      const data = await response.json();
      return this.parseResponse(data, query.region.toUpperCase());
    } catch (error) {
      this.logger.warn(`Serper request failed: ${(error as Error).message}`);
      return this.fallbackSearch(query);
    }
  }

  private readonly storeUrls: Record<string, (q: string) => string> = {
    ozon: (q) => `https://www.ozon.ru/search/?text=${q}&from_global=true`,
    wildberries: (q) => `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}`,
    'яндекс.маркет': (q) => `https://market.yandex.ru/search?text=${q}`,
    'yandex market': (q) => `https://market.yandex.ru/search?text=${q}`,
    dns: (q) => `https://www.dns-shop.ru/search/?q=${q}`,
    'м.видео': (q) => `https://www.mvideo.ru/search?q=${q}`,
    'citilink': (q) => `https://www.citilink.ru/search/?text=${q}`,
    'ситилинк': (q) => `https://www.citilink.ru/search/?text=${q}`,
    'regard': (q) => `https://www.regard.ru/search?q=${q}`,
    'эльдорадо': (q) => `https://eldorado.ru/search/?q=${q}`,
    amazon: (q) => `https://www.amazon.com/s?k=${q}`,
    'amazon de': (q) => `https://www.amazon.de/s?k=${q}`,
    walmart: (q) => `https://www.walmart.com/search?q=${q}`,
    'best buy': (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,
    target: (q) => `https://www.target.com/s?searchTerm=${q}`,
    mediamarkt: (q) => `https://www.mediamarkt.de/search?query=${q}`,
    aliexpress: (q) => `https://aliexpress.ru/wholesale?SearchText=${q}`,
    ebay: (q) => `https://www.ebay.com/sch/i.html?_nkw=${q}`,
  };

  private extractRealUrl(rawUrl: string): string | null {
    if (!rawUrl) return null;
    // Google redirect: https://www.google.com/url?q=https://ozon.ru/product/...
    if (rawUrl.includes('google.com/url?q=')) {
      try {
        const u = new URL(rawUrl);
        const q = u.searchParams.get('q');
        if (q && (q.startsWith('http://') || q.startsWith('https://'))) return q;
      } catch { /* ignore */ }
    }
    if (rawUrl.includes('google.com')) return null;
    return rawUrl;
  }

  private isKnownStoreDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      const knownDomains = [
        'ozon.ru', 'wildberries.ru', 'wb.ru', 'market.yandex.ru', 'dns-shop.ru',
        'mvideo.ru', 'citilink.ru', 'regard.ru', 'eldorado.ru', 'biggeek.ru',
        'mobilo4ka.ru', 'apple-com.ru', 'ipac67.ru',
        'amazon.com', 'amazon.de', 'amazon.co.uk', 'walmart.com', 'bestbuy.com',
        'ebay.com', 'mediamarkt.de', 'target.com', 'aliexpress.ru', 'aliexpress.com',
      ];
      return knownDomains.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch { return false; }
  }

  private toDirectUrl(shop: string, title: string, fallbackUrl: string, region = 'RU'): string {
    const q = encodeURIComponent(title.replace(/[^a-zA-Zа-яёА-ЯЁ0-9\s\-]/g, '').trim().slice(0, 120));
    const shopLower = shop.toLowerCase();

    // Try to extract real product URL from Google redirect
    const realUrl = this.extractRealUrl(fallbackUrl);

    // If we got a real URL and it's a known store domain, use it directly
    if (realUrl && this.isKnownStoreDomain(realUrl)) {
      return realUrl;
    }

    // Fall back to search URL on the appropriate marketplace
    const searchUrls: Record<string, (q: string) => string> = {
      ozon: (q) => `https://www.ozon.ru/search/?text=${q}&from_global=true`,
      wildberries: (q) => `https://www.wildberries.ru/catalog/0/search.aspx?search=${q}`,
      'яндекс.маркет': (q) => `https://market.yandex.ru/search?text=${q}`,
      'yandex market': (q) => `https://market.yandex.ru/search?text=${q}`,
      dns: (q) => `https://www.dns-shop.ru/search/?q=${q}`,
      'м.видео': (q) => `https://www.mvideo.ru/search?q=${q}`,
      citilink: (q) => `https://www.citilink.ru/search/?text=${q}`,
      regard: (q) => `https://www.regard.ru/search?q=${q}`,
      eldorado: (q) => `https://eldorado.ru/search/?q=${q}`,
      aliexpress: (q) => `https://aliexpress.ru/wholesale?SearchText=${q}`,
      biggeek: (q) => `https://biggeek.ru/catalog?q=${q}`,
      amazon: (q) => `https://www.amazon.com/s?k=${q}`,
      walmart: (q) => `https://www.walmart.com/search?q=${q}`,
      bestbuy: (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,
      mediamarkt: (q) => `https://www.mediamarkt.de/search?query=${q}`,
      ebay: (q) => `https://www.ebay.com/sch/i.html?_nkw=${q}`,
    };

    for (const [key, builder] of Object.entries(searchUrls)) {
      if (shopLower.includes(key)) {
        return builder(q);
      }
    }

    const fallbackMap: Record<string, string> = {
      RU: `https://www.ozon.ru/search/?text=${q}&from_global=true`,
      US: `https://www.amazon.com/s?k=${q}`,
      EU: `https://www.mediamarkt.de/search?query=${q}`,
      ASIA: `https://aliexpress.ru/wholesale?SearchText=${q}`,
    };

    const regionKey = region.toUpperCase();
    return fallbackMap[regionKey] || fallbackMap['RU'];
  }

  private parseResponse(data: any, region: string): SearchOffer[] {
    const results: SearchOffer[] = [];
    const items = data.shopping || data.organic || [];

    for (const item of items.slice(0, 15)) {
      const price = item.price?.amount || parseFloat(String(item.price ?? '').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
      const currency = item.price?.currency || (region === 'RU' ? 'RUB' : region === 'EU' ? 'EUR' : region === 'ASIA' ? 'JPY' : 'USD');
      const shop = item.source || item.store || 'Store';
      const title = item.title || '';

      results.push({
        shop,
        price,
        currency,
        url: this.toDirectUrl(shop, title, item.link || item.product_link || '', region),
        region,
        shipping: item.shipping ? parseFloat(String(item.shipping).replace(/[^0-9.]/g, '')) : undefined,
      });
    }

    return results;
  }

  private fallbackSearch(_query: SearchQuery): SearchOffer[] {
    return [];
  }
}