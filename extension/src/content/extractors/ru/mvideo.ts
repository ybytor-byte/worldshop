import { BaseExtractor } from '../base-extractor';

export class MvideoExtractor extends BaseExtractor {
  readonly shop = 'mvideo';

  matchesDomain(hostname: string): boolean {
    return hostname.includes('mvideo.ru');
  }

  extractTitle(doc: Document): string {
    return this.queryText(doc, [
      'h1.fl-product-title',
      'h1.product-title',
      'h1.title',
      'h1',
    ]);
  }

  extractPrice(doc: Document): string {
    return this.queryText(doc, [
      'span.price__main-value',
      'span.price-value',
      'div.fl-product-price span.price__main-value',
      'span.price__value',
    ]);
  }

  extractSpecs(doc: Document): string {
    const specs = this.queryAllText(doc, [
      'div.product-feature-list tr',
      'div.product-feature-list__item',
      'div.fl-product-features__item',
      'table.product-features-table tr',
    ]);
    if (specs) return specs;

    return this.queryText(doc, [
      'div.product-feature-list',
      'div.product-features-container',
    ]);
  }
}
