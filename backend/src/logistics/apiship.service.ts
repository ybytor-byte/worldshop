import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DeliveryRequest {
  weight: number;
  width: number;
  height: number;
  depth: number;
  fromCity: string;
  toCity: string;
  declaredPrice: number;
}

export interface DeliveryEstimate {
  carrier: string;
  price: number;
  currency: string;
  daysMin: number;
  daysMax: number;
}

@Injectable()
export class ApiShipService {
  private readonly logger = new Logger(ApiShipService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.apiship.ru/v1';

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('APISHIP_KEY') || '';
  }

  async calculateDelivery(req: DeliveryRequest): Promise<DeliveryEstimate[]> {
    if (!this.apiKey) {
      this.logger.warn('APISHIP_KEY not configured');
      return this.fallbackEstimates(req);
    }

    try {
      const response = await fetch(`${this.baseUrl}/calculator/tariff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_location: { city: req.fromCity },
          to_location: { city: req.toCity },
          packages: [{
            weight: Math.max(req.weight, 0.5),
            width: req.width,
            height: req.height,
            depth: req.depth,
          }],
          declared_price: req.declaredPrice,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        this.logger.warn(`ApiShip tariff error: ${response.status}`);
        return this.fallbackEstimates(req);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (err: any) {
      this.logger.warn(`ApiShip call failed: ${err.message}`);
      return this.fallbackEstimates(req);
    }
  }

  private parseResponse(data: any): DeliveryEstimate[] {
    const tariffs = data.tariffs || data.data || data.result || [];
    if (!Array.isArray(tariffs)) return [];

    return tariffs.slice(0, 5).map((t: any) => ({
      carrier: t.carrier_name || t.carrier || 'Unknown',
      price: parseFloat(t.total_price || t.price || '0'),
      currency: t.currency || 'RUB',
      daysMin: parseInt(t.days_min || t.time_min || '1'),
      daysMax: parseInt(t.days_max || t.time_max || '10'),
    }));
  }

  private fallbackEstimates(req: DeliveryRequest): DeliveryEstimate[] {
    const base = req.weight * 5;
    return [
      { carrier: 'Почта России', price: base + 3, currency: 'RUB', daysMin: 5, daysMax: 14 },
      { carrier: 'СДЭК', price: base + 2, currency: 'RUB', daysMin: 2, daysMax: 7 },
      { carrier: 'Boxberry', price: base + 2.5, currency: 'RUB', daysMin: 3, daysMax: 10 },
    ];
  }
}
