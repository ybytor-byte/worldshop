import { BaseExtractor } from '../base-extractor';

export class OzonExtractor extends BaseExtractor {
  readonly shop = 'ozon';

  matchesDomain(hostname: string): boolean {
    return hostname.includes('ozon.ru');
  }

  extractTitle(doc: Document): string {
    return this.queryText(doc, [
      'h1[data-widget="webProductHeading"]',
      'h1.tsHeadline550Medium',
      'div[data-widget="webProductHeading"] h1',
      'h1',
    ]);
  }

  extractPrice(doc: Document): string {
    return this.queryText(doc, [
      'span[data-auto="mainPrice"]',
      'div[data-widget="webPrice"] span.c3 span',
      'div[data-widget="webPrice"] span',
      'span.c3-a1',
      'div.c3-a2 span',
    ]);
  }

  extractSpecs(doc: Document): string {
    // Ozon characteristics are in a widget or description block
    const chars = this.queryAllText(doc, [
      'div[data-widget="webCharacteristics"] dl',
      'div[data-widget="webCharacteristics"] li',
      'div[data-widget="webDescription"] div',
    ]);
    if (chars) return chars;

    // Fallback: get the short description
    return this.queryText(doc, [
      'div[data-widget="webShortCharacteristics"]',
      'div[data-widget="webDescription"]',
    ]);
  }
}
