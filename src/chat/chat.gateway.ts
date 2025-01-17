import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthMiddleware } from 'src/common/middlewares/auth.middleware';
import { UseGuards } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateGroupDto } from './dto/create-group.dto';

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

  // Todo : make dto of typing in for one on one take receiverId and for Group take Pariticipant array and update them like wise. 
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { userId: number; chatId: string; typingFlag: boolean; receiverId: number },
    @ConnectedSocket() client: Socket,
  ) {
    // console.log(
    //   'Typing Hit. chatId',
    //   data.chatId,
    //   ' userId: ',
    //   data.userId,
    //   ' receiverId: ',
    //   data.receiverId,
    //   ' typing: ',
    //   data.typingFlag,
    // );
  
    // Ensure room `user_<receiverId>` exists and user is subscribed
    this.server.to(`user_${data.receiverId}`).emit('recievetyping', {
      userId: data.userId,
      typing: data.typingFlag,
    });
    //console.log('Typing event sent');
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
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { image, chatId } = createMessageDto;
  
      // Convert base64 image to Buffer if it exists
      const imageBlob = image ? Buffer.from(image, 'base64') : null;
  
      // Send message using the service
      const message = await this.chatService.sendMessage(
        { ...createMessageDto, image: imageBlob },
        this.server
      );
  
      // Notify users in the chat
      if (createMessageDto.msgType === 'Group') {
        // Notify all participants in the group
        console.log('Msg in Group: ', createMessageDto);
        createMessageDto.participants.forEach((participant) => {
          const participantId = participant.id; 
          if(participantId!==createMessageDto.senderId){
            this.server.to(`user_${participantId}`).emit('newMessage', {
              ...message,
              image: createMessageDto.image, // Sending back the base64 string to display in UI
            });
          }
        });
      } else {
        // Notify only the receiver
        this.server.to(`user_${createMessageDto.receiverId}`).emit('newMessage', {
          ...message,
          image: createMessageDto.image, // Sending back the base64 string to display in UI
        });
      }

      // Acknowledge the sender
      client.emit('messageSent', message);
    } catch (error) {
      // Handle errors gracefully
      client.emit('messageError', { error: error.message });
    }
  }


  @SubscribeMessage('createGroup')
async handleGroupCreation(
  @MessageBody() createGroupDto: CreateGroupDto,
  @ConnectedSocket() client: Socket
) {
  try {
    const { name, participants } = createGroupDto;

    // Create a new chat group using the service
    const group = await this.chatService.createChatGroup(createGroupDto);

    // Notify all participants about the group creation
    participants.forEach((participantId) => {
      this.server.to(`user_${participantId}`).emit('groupCreated', {
        groupId: group.id,
        name: group.name,
        participants: group.participants,
      });
    });

    // Acknowledge the creator of the group
    client.emit('groupCreatedAck', {
      groupId: group.id,
      name: group.name,
      participants: group.participants,
    });
  } catch (error) {
    // Handle errors gracefully
    client.emit('groupCreationError', { error: error.message });
  }
}


}
