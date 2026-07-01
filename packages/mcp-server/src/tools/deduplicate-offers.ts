export function deduplicateOffers(offers: any[]): any[] {
  const seen = new Map<string, any>();

  for (const offer of offers) {
    const key = `${offer.shop || ''}|${offer.title || offer.productName || ''}`.toLowerCase();
    const existing = seen.get(key);

    if (!existing || (offer.price || 0) < (existing.price || Infinity)) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values());
}
