import { Controller, Get, Param, UseGuards, Req, Body, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { GetUser } from './decorators/getUser.decorator';
import { CreateGroupDto } from './dto/create-group.dto';

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

  // For Postman Testing
  // @Post('/messages/creategroup')
  // async createGroup(
  //   @Body() createGroupDto: CreateGroupDto,
  //   @GetUser('userId') userId: number,
  // ) {
  //   try {
  //     if (!createGroupDto.participants.includes(userId)) {
  //       createGroupDto.participants.push(userId);
  //     }

  //     const chat = await this.chatService.createChatGroup(createGroupDto);

  //     return chat;
  //   } catch (error) {
  //     return { error: error.message };
  //   }
  // }

  @Get('/groups')
  async getUserGroups(@GetUser('userId') userId: number) {
    try {
      const groups = await this.chatService.getUserGroups(userId);
      return { groups };
    } catch (error) {
      return { error: error.message };
    }
  }

}
