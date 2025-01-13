import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthMiddleware } from 'src/common/middlewares/auth.middleware';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}
  @UseGuards(AuthMiddleware)
  @SubscribeMessage('handleConnection')
  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      console.log(`User joined room: user_${userId}`);
      client.join(`user_${userId}`);
    }
  }

  @SubscribeMessage('fetchMessages')
  async fetchMessages(client: Socket, data: { loggedInUserId: number; otherUserId: number }) {
    try {
      const messages = await this.chatService.getMessages(data.loggedInUserId, data.otherUserId);
      client.emit('messagesFetched', messages);
    } catch (error) {
      client.emit('errorFetchingMessages', { error: error.message });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() createMessageDto: any, @ConnectedSocket() client: Socket) {
    try {
      const message =await this.chatService.sendMessage(createMessageDto, this.server);
      
      // Notify the receiver if they're connected
      this.server.to(`user_${createMessageDto.receiverId}`).emit('newMessage', message);

      // Emit confirmation or message to client
      client.emit('messageSent', message);
    } catch (error) {
      client.emit('messageError', { error: error.message });
    }
  }
}
