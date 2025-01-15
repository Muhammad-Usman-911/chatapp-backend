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
      console.log(`User joined room: ${userId}`);
      client.join(`user_${userId}`);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { userId: number; chatId: string; typingFlag: boolean; receiverId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      'Typing Hit. chatId',
      data.chatId,
      ' userId: ',
      data.userId,
      ' receiverId: ',
      data.receiverId,
      ' typing: ',
      data.typingFlag,
    );
  
    // Ensure room `user_<receiverId>` exists and user is subscribed
    this.server.to(`user_${data.receiverId}`).emit('recievetyping', {
      userId: data.userId,
      typing: data.typingFlag,
    });
    console.log('Typing event sent');
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
      let imageBlob: Buffer | null = null;

      if (createMessageDto.image) {
        imageBlob = Buffer.from(createMessageDto.image, 'base64'); 
      }

      const message = await this.chatService.sendMessage({
        ...createMessageDto,
        image: imageBlob,
      }, this.server);

      this.server.to(`user_${createMessageDto.receiverId}`).emit('newMessage', message);

      client.emit('messageSent', message);
    } catch (error) {
      client.emit('messageError', { error: error.message });
    }
  }

}
