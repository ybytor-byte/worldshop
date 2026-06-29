export interface RawProductPayload {
  url: string;
  shop: string;            // "ozon", "wildberries", "dns", "mvideo", "yandex-market", ...
  title: string;
  priceBlockText: string;  // сырой текст с ценой/валютой
  specsText: string;       // очищенный текст характеристик / описание
  rawDomSnapshot?: string; // по необходимости: фрагмент HTML после фильтрации
}

export interface AiProductDto {
  brand: string;
  model: string;
  price: number;
  currency: string;
  specs: Record<string, any>;
}

export interface Offer {
  shop: string;
  price: number;
  currency: string;
  url: string;
  affiliateUrl?: string;
}

export interface Product {
  id: string;
  brand: string;
  model: string;
  specs: Record<string, any>;
  offers: Offer[];
  createdAt: string;
  updatedAt: string;
}
