import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}
  @Get('/')
  async checkMessage(){
    return {
      message:"working fine.",
    }
  }
  @Get('/messages/:userId/:otherUserId')
  async getMessages(@Param('otherUserId') otherUserId: number, @Param('userId') userId: number) {
    try {
      const messages = await this.chatService.getMessages(userId, otherUserId);
      return { messages };
    } catch (error) {
      return { error: error.message };
    }
  }
}
