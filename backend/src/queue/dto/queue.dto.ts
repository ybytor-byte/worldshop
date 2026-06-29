export interface AiProductResult {
  brand: string;
  model: string;
  price: number;
  currency: string;
  specs: Record<string, any>;
}