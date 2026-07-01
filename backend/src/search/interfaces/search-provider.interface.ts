export interface SearchOffer {
  shop: string;
  price: number;
  currency: string;
  url: string;
  region: string;
  shipping?: number;
  deliveryDays?: string;
  affiliateUrl?: string;
}

export interface SearchQuery {
  text: string;
  region: string;
  barcode?: string;
  limit?: number;
}

export interface SearchProvider {
  readonly name: string;
  readonly supportedRegions: string[];
  supportsRegion(region: string): boolean;
  search(query: SearchQuery): Promise<SearchOffer[]>;
}
