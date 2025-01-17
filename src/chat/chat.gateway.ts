import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthMiddleware } from 'src/common/middlewares/auth.middleware';
import { UseGuards } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { group } from 'console';
import { TypingDto } from './dto/typing.dto';

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
    @MessageBody() typingDto: TypingDto,
    @ConnectedSocket() client: Socket
  ) {
    const { userId, chatId, typing, receiverId, participants } = typingDto;
  
    if (participants && participants.length > 0) {
      // Typing in a group chat
      participants.forEach((participant) => {
        if (participant.id !== userId) {
          this.server.to(`user_${participant.id}`).emit('recievetyping', {
            userId,
            chatId,
            typing,
            group: true,
          });
        }
      });
    } else if (receiverId) {
      // Typing in a one-to-one chat
      this.server.to(`user_${receiverId}`).emit('recievetyping', {
        userId,
        chatId,
        typing,
        group: false,
      });
    }
  
    // Optionally log the event
    console.log('Typing event sent:', { userId, chatId, typing, receiverId, participants });
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
      console.log('Msg from FrontEnd : ',createMessageDto);
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
              image: createMessageDto.image, 
              group:true// Sending back the base64 string to display in UI
            });
          }
        });
      } else {
        // Notify only the receiver
        this.server.to(`user_${createMessageDto.receiverId}`).emit('newMessage', {
          ...message,
          image: createMessageDto.image,
          group:false, // Sending back the base64 string to display in UI
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
