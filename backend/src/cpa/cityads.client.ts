import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CityAdsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CityAdsFeedProduct {
  id: string;
  name: string;
  price: string;
  currency: string;
  url: string;
  originalUrl: string;
  vendor: string;
  category: string;
  image: string;
  description: string;
  availability: string;
  brand: string;
  model: string;
  sku: string;
}

export interface CityAdsFeedResponse {
  products: CityAdsFeedProduct[];
  updated_at: string;
  total: number;
}

@Injectable()
export class CityAdsClient {
  private readonly logger = new Logger(CityAdsClient.name);
  private readonly baseUrl = 'https://api.cityads.com';
  private readonly authUrl = 'https://auth2.cityads.com/oauth/access_token';
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private configService: ConfigService) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('CITYADS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('CITYADS_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('CityAds credentials not configured');
    }

    try {
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`CityAds auth failed: ${response.status} ${error}`);
      }

      const data: CityAdsTokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

      this.logger.log('CityAds access token obtained');
      return this.accessToken;
    } catch (error: any) {
      this.logger.error(`Failed to get CityAds token: ${error.message}`);
      throw error;
    }
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.toString(), {
      headers: { 'X-Access-Token': token },
    });

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 401) {
        this.accessToken = null;
        return this.request<T>(endpoint, params);
      }
      throw new Error(`CityAds API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async getFeed(feedId: string, params: { limit?: number; offset?: number; updated_since?: string } = {}): Promise<CityAdsFeedResponse> {
    const queryParams: Record<string, string> = {
      feed_id: feedId,
      limit: String(params.limit || 1000),
      offset: String(params.offset || 0),
    };

    if (params.updated_since) {
      queryParams.updated_since = params.updated_since;
    }

    return this.request<CityAdsFeedResponse>('/v1/feed', queryParams);
  }

  async getAllFeeds(): Promise<any[]> {
    return this.request<any[]>('/v1/feeds');
  }

  transformProduct(product: CityAdsFeedProduct): {
    shop: string;
    brand: string;
    model: string;
    price: number;
    currency: string;
    url: string;
    affiliateUrl: string;
  } {
    const price = parseFloat(product.price);
    const brand = product.brand || product.name.split(' ')[0] || 'Unknown';
    const model = product.model || product.name.replace(brand, '').trim() || product.name;

    return {
      shop: product.vendor || 'CityAds',
      brand,
      model,
      price: isNaN(price) ? 0 : price,
      currency: product.currency || 'RUB',
      url: product.url,
      affiliateUrl: product.originalUrl || product.url,
    };
  }
}