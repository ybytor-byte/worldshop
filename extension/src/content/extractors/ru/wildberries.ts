import { BaseExtractor } from '../base-extractor';

export class WildberriesExtractor extends BaseExtractor {
  readonly shop = 'wildberries';

  matchesDomain(hostname: string): boolean {
    return hostname.includes('wildberries.ru');
  }

  extractTitle(doc: Document): string {
    return this.queryText(doc, [
      'h1.product-page__title',
      'h1.same-part-kt__header',
      'span.goods-name',
      'h1',
    ]);
  }

  extractPrice(doc: Document): string {
    return this.queryText(doc, [
      'ins.price-block__final-price',
      'span.price-block__final-price',
      'p.price-block__price-wrap ins',
      'span.product-price',
    ]);
  }

  extractSpecs(doc: Document): string {
    const specs = this.queryAllText(doc, [
      'table.product-params__table tr',
      'div.product-params__row',
      'li.product-params__cell',
    ]);
    if (specs) return specs;

    return this.queryText(doc, [
      'div.collapsable__content',
      'section.product-detail__description',
    ]);
  }
}
