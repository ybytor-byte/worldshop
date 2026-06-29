import { BaseExtractor } from './base-extractor';

export class FallbackExtractor extends BaseExtractor {
  readonly shop = 'generic-fallback';

  matchesDomain(hostname: string): boolean {
    return true; // Always matches as fallback
  }

  extractTitle(doc: Document): string {
    // 1. Try JSON-LD
    const jsonLd = this.parseJsonLd(doc);
    if (jsonLd && jsonLd.name) {
      return jsonLd.name;
    }

    // 2. Try standard selectors
    return this.queryText(doc, [
      '[itemprop="name"]',
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'h1.product-title',
      'h1.title',
      'h1',
    ]);
  }

  extractPrice(doc: Document): string {
    const jsonLd = this.parseJsonLd(doc);
    if (jsonLd && jsonLd.offers) {
      const offers = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
      if (offers && offers.price) {
        return `${offers.price} ${offers.priceCurrency || 'RUB'}`;
      }
    }

    return this.queryText(doc, [
      '[itemprop="price"]',
      'meta[property="product:price:amount"]',
      '.product-price',
      '.price',
    ]);
  }

  extractSpecs(doc: Document): string {
    const jsonLd = this.parseJsonLd(doc);
    if (jsonLd && jsonLd.description) {
      return jsonLd.description;
    }

    return this.queryText(doc, [
      '[itemprop="description"]',
      'meta[property="og:description"]',
      'meta[name="description"]',
      '#description',
      '.description',
    ]);
  }

  private parseJsonLd(doc: Document): any {
    try {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const script of Array.from(scripts)) {
        if (!script.textContent) continue;
        const data = JSON.parse(script.textContent);
        
        // Handle direct object or graph array
        const findProduct = (obj: any): any => {
          if (!obj) return null;
          if (obj['@type'] === 'Product') return obj;
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const res = findProduct(item);
              if (res) return res;
            }
          }
          if (obj['@graph'] && Array.isArray(obj['@graph'])) {
            return findProduct(obj['@graph']);
          }
          return null;
        };

        const product = findProduct(data);
        if (product) return product;
      }
    } catch {
      // Ignore JSON parse errors in script elements
    }
    return null;
  }
}
