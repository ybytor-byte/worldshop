import { BaseExtractor } from './base-extractor';
import { OzonExtractor } from './ru/ozon';
import { WildberriesExtractor } from './ru/wildberries';
import { DnsExtractor } from './ru/dns';
import { MvideoExtractor } from './ru/mvideo';
import { YandexMarketExtractor } from './ru/yandex-market';
import { FallbackExtractor } from './fallback';

// Initialize the registry list
const extractors: BaseExtractor[] = [
  new OzonExtractor(),
  new WildberriesExtractor(),
  new DnsExtractor(),
  new MvideoExtractor(),
  new YandexMarketExtractor(),
];

const fallbackExtractor = new FallbackExtractor();

/**
 * Finds the correct extractor based on domain name, or returns the generic fallback.
 */
export function getExtractorForDomain(hostname: string): BaseExtractor {
  for (const extractor of extractors) {
    if (extractor.matchesDomain(hostname)) {
      return extractor;
    }
  }
  return fallbackExtractor;
}
