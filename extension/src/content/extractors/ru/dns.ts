import { BaseExtractor } from '../base-extractor';

export class DnsExtractor extends BaseExtractor {
  readonly shop = 'dns';

  matchesDomain(hostname: string): boolean {
    return hostname.includes('dns-shop.ru');
  }

  extractTitle(doc: Document): string {
    return this.queryText(doc, [
      'h1.product-card-top__title',
      'h1.product-card__title',
      'h1',
    ]);
  }

  extractPrice(doc: Document): string {
    return this.queryText(doc, [
      'div.product-buy__price',
      'div.product-buy__price-group_price',
      'span.product-buy__price',
      'div.current-price-value',
    ]);
  }

  extractSpecs(doc: Document): string {
    const specs = this.queryAllText(doc, [
      'div.product-characteristics__spec',
      'div.product-characteristics tr',
      'table.product-characteristics__table tr',
    ]);
    if (specs) return specs;

    return this.queryText(doc, [
      'div.product-characteristics',
      'div.product-card-description__text',
    ]);
  }
}
