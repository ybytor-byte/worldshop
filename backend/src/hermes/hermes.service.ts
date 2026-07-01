import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ProductPayload {
  title: string;
  priceBlockText: string;
  specsText: string;
  shop: string;
  rawDomSnapshot?: string;
  imageUrl?: string;
}

interface TechPassport {
  brand: string;
  model: string;
  price: number;
  currency: string;
  specs: Record<string, any>;
  category?: string;
  ean?: string;
  sku?: string;
}

@Injectable()
export class HermesService {
  private readonly logger = new Logger(HermesService.name);
  private readonly llamaUrl: string;
  private readonly hermesUrl: string;

  constructor(configService: ConfigService) {
    this.llamaUrl = configService.get<string>('LLAMA_URL') || 'http://localhost:8081';
    this.hermesUrl = configService.get<string>('HERMES_URL') || 'http://localhost:56677';
  }

  async cleanProductName(rawTitle: string): Promise<string> {
    this.logger.log(`Cleaning product name: "${rawTitle.slice(0, 100)}"`);

    const systemPrompt = 'Ты — ассистент по товарам. Из текста ниже выдели ТОЛЬКО бренд и модель товара. Ответь одной короткой фразой (максимум 10 слов). Без лишнего текста, без пояснений. Пример: "iPhone 15 Pro 128GB" или "Samsung Galaxy S24 Ultra".';

    try {
      const result = await this.callLlama(systemPrompt, rawTitle);
      const cleaned = result.replace(/[^\w\s\-а-яёА-ЯЁ0-9\.]/g, '').trim();
      if (cleaned.length > 3 && cleaned.length < 80) {
        this.logger.log(`Cleaned: "${rawTitle.slice(0, 60)}" → "${cleaned}"`);
        return cleaned;
      }
    } catch (e) {
      this.logger.warn(`cleanProductName failed: ${(e as Error).message}`);
    }

    return rawTitle.replace(/купить.*$/i, '').replace(/с доставкой.*$/i, '').trim().slice(0, 60);
  }

  async extractProduct(payload: ProductPayload): Promise<TechPassport> {
    this.logger.log(`Extracting product: ${payload.title}`);

    const systemPrompt = `You are a product data specialist. Extract product information and return ONLY valid JSON.

Return EXACTLY this JSON format (no markdown, no other text):
{
  "brand": "string",
  "model": "string",
  "price": number,
  "currency": "RUB | USD | EUR",
  "specs": { "key": "value" },
  "category": "string (optional)",
  "ean": "string (optional)",
  "sku": "string (optional)"
}`;

    const userMessage = [
      `Shop: ${payload.shop}`,
      `Title: ${payload.title}`,
      `Price text: ${payload.priceBlockText}`,
      `Specs/Description: ${payload.specsText}`,
      payload.imageUrl ? `Product image available: ${payload.imageUrl}` : '',
      payload.rawDomSnapshot ? `DOM fragment: ${payload.rawDomSnapshot.slice(0, 3000)}` : '',
    ].filter(Boolean).join('\n\n');

    try {
      const result = await this.callLlama(systemPrompt, userMessage, payload.imageUrl);
      return this.parseResult(result);
    } catch (error) {
      this.logger.warn(`llama-server failed, trying Hermes. Error: ${(error as Error).message}`);
      return this.extractViaHermes(payload);
    }
  }

  async searchProduct(query: string): Promise<any[]> {
    this.logger.log(`Searching product: ${query}`);

    const systemPrompt = `You are a shopping assistant. Search for the product and return available offers.

Return ONLY valid JSON array:
[
  {
    "shop": "string",
    "price": number,
    "currency": "string",
    "url": "string",
    "inStock": boolean
  }
]`;

    try {
      const result = await this.callLlama(systemPrompt, `Search for product: ${query}`);
      return JSON.parse(result);
    } catch (error) {
      this.logger.warn(`Search via llama failed: ${(error as Error).message}`);
      return [];
    }
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    this.logger.log('Analyzing image via multimodal');

    const payload = {
      model: 'gemma4',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    };

    try {
      const response = await fetch(`${this.llamaUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`llama-server returned ${response.status}`);
      }

      const data = await response.json() as any;
      const msg = data.choices?.[0]?.message || {};
      return msg.content || msg.reasoning_content || '';
    } catch (error) {
      this.logger.warn(`llama-server vision failed: ${(error as Error).message}`);
      return '';
    }
  }

  private async callLlama(systemPrompt: string, userMessage: string, imageUrl?: string): Promise<string> {
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userMessage },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

    const response = await fetch(`${this.llamaUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma4',
        messages,
        temperature: 0.1,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`llama-server error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as any;
    const msg = data.choices?.[0]?.message || {};
    return msg.content || msg.reasoning_content || '';
  }

  private async extractViaHermes(payload: ProductPayload): Promise<TechPassport> {
    const systemPrompt = `You are a product data specialist shopping agent.

GOAL: Extract structured product data and search for current prices.

Steps:
1. Analyze the product information provided
2. Extract: brand, model, price, currency, specs, category
3. Search the web for this product to find current offers across shops
4. Return the complete tech passport with best prices found

Use the web search and browser tools to find matching products.`;

    const session = await this.createHermesSession(payload, systemPrompt);
    if (!session) {
      throw new Error('Failed to create Hermes session');
    }
    return this.waitForHermesResult(session);
  }

  private async createHermesSession(payload: ProductPayload, systemPrompt: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.hermesUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          message: [
            `Shop: ${payload.shop}`,
            `Title: ${payload.title}`,
            `Price text: ${payload.priceBlockText}`,
            `Specs/Description: ${payload.specsText}`,
          ].filter(Boolean).join('\n\n'),
        }),
      });

      if (!response.ok) return null;

      const data = await response.json() as any;
      return data.session_id || null;
    } catch {
      return null;
    }
  }

  private async waitForHermesResult(sessionId: string): Promise<TechPassport> {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.hermesUrl}/api/sessions/${sessionId}/messages`);
        if (response.ok) {
          const data = await response.json() as any;
          const lastMessage = Array.isArray(data) ? data[data.length - 1] : data;
          if (lastMessage?.role === 'assistant' && lastMessage?.content) {
            return this.parseResult(lastMessage.content);
          }
        }
      } catch {
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error('Hermes session timed out');
  }

  private parseResult(raw: string): TechPassport {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        brand: String(parsed.brand || 'Unknown'),
        model: String(parsed.model || 'Unknown'),
        price: Number(parsed.price) || 0,
        currency: String(parsed.currency || 'RUB'),
        specs: parsed.specs || {},
        category: parsed.category,
        ean: parsed.ean,
        sku: parsed.sku,
      };
    } catch {
      throw new Error('Failed to parse JSON response');
    }
  }
}