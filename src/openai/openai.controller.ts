import { Controller, Get, Query } from '@nestjs/common';
import { OpenaiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}
  @Get('chat')
  async getChatResponse(@Query('prompt') prompt: string): Promise<string> {
    return this.openaiService.getChatCompletion(prompt);
  }
}
