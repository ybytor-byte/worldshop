import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SHOP_LINKS = [
  { name: 'Ozon', url: (q: string) => `https://www.ozon.ru/search/?text=${encodeURIComponent(q)}` },
  { name: 'Wildberries', url: (q: string) => `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(q)}` },
  { name: 'Яндекс.Маркет', url: (q: string) => `https://market.yandex.ru/search?text=${encodeURIComponent(q)}` },
  { name: 'DNS', url: (q: string) => `https://www.dns-shop.ru/search/?q=${encodeURIComponent(q)}` },
  { name: 'М.Видео', url: (q: string) => `https://www.mvideo.ru/product-list-page?q=${encodeURIComponent(q)}` },
  { name: 'AliExpress', url: (q: string) => `https://aliexpress.ru/wholesale?SearchText=${encodeURIComponent(q)}` },
  { name: 'Citilink', url: (q: string) => `https://www.citilink.ru/search/?text=${encodeURIComponent(q)}` },
];

@Injectable()
export class SearchByImageService {
  private readonly logger = new Logger(SearchByImageService.name);
  private readonly llamaUrl: string;

  constructor(configService: ConfigService) {
    this.llamaUrl = configService.get<string>('LLAMA_URL') || 'http://localhost:8081';
  }

  async identifyProduct(imageBase64: string): Promise<{ brand: string; model: string; description: string }> {
    const prompt = `You are a product scanner. Identify the main product in this image. Reply with ONLY 2-3 keywords that describe the product (e.g., 'iphone smartphone apple' or 'dyson hair dryer' or 'sony headphones'). Do not use full sentences.`;

    const response = await fetch(`${this.llamaUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma4',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 64,
      }),
    });

    if (!response.ok) {
      throw new Error(`llama-server error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = (data.choices?.[0]?.message?.content || '').trim();

    const keywords = content.split(/[\s,]+/).filter((w: string) => w.length > 2);
    const brand = keywords[0] || '';
    const model = keywords.slice(1).join(' ') || '';
    return { brand, model, description: content.slice(0, 200) };
  }

  getShopLinks(query: string) {
    return SHOP_LINKS.map((shop) => ({
      name: shop.name,
      url: shop.url(query),
    }));
  }
}