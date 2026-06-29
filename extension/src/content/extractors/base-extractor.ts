import type { RawProductPayload } from './types';

/**
 * Base class for marketplace-specific product extractors.
 * Each extractor knows how to parse a specific shop's product page DOM.
 */
export abstract class BaseExtractor {
  abstract readonly shop: string;

  /** Check if this extractor handles the given hostname */
  abstract matchesDomain(hostname: string): boolean;

  /** Extract the product title from the page */
  abstract extractTitle(doc: Document): string;

  /** Extract the raw price text (including currency symbols) */
  abstract extractPrice(doc: Document): string;

  /** Extract the specs/characteristics text */
  abstract extractSpecs(doc: Document): string;

  /**
   * Try multiple CSS selectors and return the text content of the first match.
   * This is the workhorse utility — selectors change frequently on live sites,
   * so we try several variants in priority order.
   */
  protected queryText(doc: Document, selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const el = doc.querySelector(selector);
        if (el && el.textContent) {
          return el.textContent.replace(/\s+/g, ' ').trim();
        }
      } catch {
        // Selector might be invalid on some pages, skip silently
      }
    }
    return '';
  }

  /**
   * Try multiple CSS selectors and concatenate all matching elements' text.
   * Useful for specs tables where data is spread across many rows.
   */
  protected queryAllText(doc: Document, selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const els = doc.querySelectorAll(selector);
        if (els.length > 0) {
          return Array.from(els)
            .map((el) => el.textContent?.replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .join(' | ');
        }
      } catch {
        // Skip invalid selectors
      }
    }
    return '';
  }

  /**
   * Run the full extraction pipeline and return a RawProductPayload.
   */
  extract(doc: Document): RawProductPayload | null {
    const title = this.extractTitle(doc);
    if (!title) return null; // Not a product page

    const priceBlockText = this.extractPrice(doc);
    const specsText = this.extractSpecs(doc);

    return {
      url: doc.location.href,
      shop: this.shop,
      title,
      priceBlockText,
      specsText,
    };
  }
}
