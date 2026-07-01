import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private service: SupportService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI support assistant (Gemma4 via llama-server)' })
  async chat(@Body() body: { message: string; history?: { role: 'user' | 'assistant'; content: string }[] }) {
    if (!body.message?.trim()) {
      return { reply: 'Напишите ваш вопрос.' };
    }
    return this.service.chat(body.message, body.history);
  }
}
