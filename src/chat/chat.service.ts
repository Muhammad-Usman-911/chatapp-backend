import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server } from 'socket.io';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async verifyUserExists(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} does not exist.`);
    }
  }

  async ensureChatExists(senderId: number, receiverId: number, type: 'one-to-one') {
    await this.verifyUserExists(senderId);
    await this.verifyUserExists(receiverId);

    let chat = await this.prisma.chat.findFirst({
      where: {
        type,
        participants: {
          every: { id: { in: [senderId, receiverId] } },
        },
      },
    });

    if (!chat) {
      console.log('Creating new chat...');
      chat = await this.prisma.chat.create({
        data: {
          type,
          participants: {
            connect: [{ id: senderId }, { id: receiverId }],
          },
        },
      });
    }

    return chat.id;
  }

  // async getMessagesBetweenUsers(senderId: number, receiverId: number): Promise<any[]> {
  //   await this.verifyUserExists(senderId);
  //   await this.verifyUserExists(receiverId);

  //   return this.prisma.message.findMany({
  //     where: {
  //       OR: [
  //         { senderId, receiverId },
  //         { senderId: receiverId, receiverId: senderId },
  //       ],
  //     },
  //     orderBy: { createdAt: 'asc' },
  //   });
  // }

  async sendMessage(createMessageDto: CreateMessageDto, socketServer: Server) {
    const { senderId, receiverId, content, image } = createMessageDto;
  
    if (!receiverId) {
      throw new Error('Receiver ID is required for one-to-one chats.');
    }
  
    try {
      // Ensure chat exists
      const currentChatId = await this.ensureChatExists(senderId, receiverId, 'one-to-one');
  
      // Create the message with potential image blob
      
      const message = this.prisma.message.create({
        data: {
          content,
          chatId: currentChatId,
          senderId,
          receiverId,
          image,  // Store the image blob here
        },
      });
  
      socketServer.to(`chat-${currentChatId}`).emit('newMessage', message);
  
      return message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw new Error('Failed to send message.');
    }
  }
  
  async getMessages(loggedInUserId: number, otherUserId: number) {
    const chat = await this.prisma.chat.findFirst({
        where: {
            type: 'one-to-one',
            participants: {
                every: {
                    id: {
                        in: [loggedInUserId, otherUserId],
                    },
                },
            },
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: 'asc', // Order messages by time
                },
            },
        },
    });

    if (!chat || !chat.messages) {
        return {
            chatId: null,
            messages: [],
        };
    }

    // Process the messages array
    const updatedMessages = chat.messages.map((message) => {
        if (message.image) {
            const uint8Array = new Uint8Array(message.image);
            const base64Image = Buffer.from(uint8Array).toString('base64');
            return {
                ...message,
                image: `${base64Image}`,
            };
        }
        return message;
    });

    // console.log('Updated Messages:', updatedMessages);

    return {
        chatId: chat.id,
        messages: updatedMessages,
    };
}

}
