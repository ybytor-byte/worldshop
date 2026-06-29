/**
 * Shared types for the extension.
 * Mirrors the shared/ package types but kept local to avoid
 * monorepo import complexity in the extension build.
 */
export interface RawProductPayload {
  url: string;
  shop: string;
  title: string;
  priceBlockText: string;
  specsText: string;
  rawDomSnapshot?: string;
}
