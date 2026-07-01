import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private readonly llamaUrl: string;

  constructor(configService: ConfigService) {
    this.llamaUrl = configService.get<string>('LLAMA_URL') || 'http://localhost:8081';
  }

  async chat(message: string, history: { role: 'user' | 'assistant'; content: string }[] = []) {
    const messages = [
      {
        role: 'system',
        content: 'Ты — дружелюбный помощник интернет-магазина WorldShop. Помогаешь пользователям с выбором товаров, сравнением цен, характеристиками. Отвечай кратко и по делу на русском языке. Если не знаешь точного ответа, предложи поискать на сайте.',
      },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    try {
      const response = await fetch(`${this.llamaUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma4',
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`llama-server error: ${response.status}`);
      }

      const data = await response.json() as any;
      const msg = data.choices?.[0]?.message || {};
      const reply = (msg.content || msg.reasoning_content || '').trim();
      return { reply: reply || 'Извините, не удалось сформировать ответ.' };
    } catch (error) {
      this.logger.error(`Chat error: ${(error as Error).message}`);
      return { reply: 'Чат поддержки временно недоступен. Попробуйте позже.' };
    }
  }
}
