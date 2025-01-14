import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { GetUser } from './decorators/getUser.decorator';

// Define a custom User interface (modify this based on actual implementation)
interface User {
  id: string;
  userId: number;
  [key: string]: any;  // Any additional properties you expect on the user object
}

// Extend Express Request to include the 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

@Controller('/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('/')
  async checkMessage() {
    return {
      message: "working fine.",
    };
  }

  @Get('/messages/:otherUserId')
  async getMessages(@Param('otherUserId') otherUserId: number, @GetUser('userId') userId: number) {
    try {
      const messages = await this.chatService.getMessages(userId, otherUserId);
      return { messages };
    } catch (error) {
      return { error: error.message };
    }
  }
}
