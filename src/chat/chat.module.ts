import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from 'src/prisma.service';
import { ChatController } from './chat.controller';
@Module({
  providers: [ChatGateway, ChatService,PrismaService],
  controllers:[ChatController],
})
export class ChatModule {}
