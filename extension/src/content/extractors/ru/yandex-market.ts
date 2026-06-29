import { BaseExtractor } from '../base-extractor';

export class YandexMarketExtractor extends BaseExtractor {
  readonly shop = 'yandex-market';

  matchesDomain(hostname: string): boolean {
    return hostname.includes('market.yandex.ru');
  }

  extractTitle(doc: Document): string {
    return this.queryText(doc, [
      'h1[data-auto="productCardTitle"]',
      'h1[data-widget="product-title"]',
      'h1',
    ]);
  }

  extractPrice(doc: Document): string {
    return this.queryText(doc, [
      'span[data-auto="mainPrice"]',
      'div[data-auto="price-block"] span',
      'span[data-widget="product-price"]',
      'span.price-value',
    ]);
  }

  extractSpecs(doc: Document): string {
    const specs = this.queryAllText(doc, [
      'div[data-auto="characteristics"] dl',
      'div[data-auto="characteristics"] tr',
      'div[data-widget="product-specs"] dl',
    ]);
    if (specs) return specs;

    return this.queryText(doc, [
      'div[data-auto="characteristics"]',
      'div[data-widget="product-specs"]',
    ]);
  }
}
