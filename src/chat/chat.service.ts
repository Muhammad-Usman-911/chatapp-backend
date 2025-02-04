import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server } from 'socket.io';
import { CreateGroupDto } from './dto/create-group.dto';

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

  
  // For Group
  // async sendMessageGroup(createMessageDto: CreateGroupMessageDto, socketServer: Server) {
  //   const { senderId, chatId, content, image } = createMessageDto;
  
    
  //   try {
  //     // Ensure chat exists
  //     const currentChatId = await this.ensureChatExists(senderId, receiverId, 'one-to-one');
  
  //     // Create the message with potential image blob
      
  //     const message = this.prisma.message.create({
  //       data: {
  //         content,
  //         chatId: currentChatId,
  //         senderId,
  //         receiverId,
  //         image,  // Store the image blob here
  //       },
  //     });
  
  //     socketServer.to(`chat-${currentChatId}`).emit('newMessage', message);
  
  //     return message;
  //   } catch (error) {
  //     console.error('Error in sendMessage:', error);
  //     throw new Error('Failed to send message.');
  //   }
  // }
  

  // async sendMessage(createMessageDto: CreateMessageDto, socketServer: Server) {
  //   const { senderId, receiverId, content, image } = createMessageDto;
  
  //   if (!receiverId) {
  //     throw new Error('Receiver ID is required for one-to-one chats.');
  //   }
  
  //   try {
  //     // Ensure chat exists
  //     const currentChatId = await this.ensureChatExists(senderId, receiverId, 'one-to-one');
  
  //     // Create the message with potential image blob
      
  //     const message = this.prisma.message.create({
  //       data: {
  //         content,
  //         chatId: currentChatId,
  //         senderId,
  //         receiverId,
  //         image,  // Store the image blob here
  //       },
  //     });
  
  //     socketServer.to(`chat-${currentChatId}`).emit('newMessage', message);
  
  //     return message;
  //   } catch (error) {
  //     console.error('Error in sendMessage:', error);
  //     throw new Error('Failed to send message.');
  //   }
  // }

async sendMessage(createMessageDto: CreateMessageDto, socketServer: Server) {
  const { senderId, content, chatId, image } = createMessageDto;

  try {
    // Create and save the message
    const message = await this.prisma.message.create({
      data: {
        content,
        chatId,
        senderId,
        image, // Store the image Blob
      },
    });

    // Notify users in the chat
    socketServer.to(`chat-${chatId}`).emit('newMessage', message);

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

async createChatGroup(createGroupDto: CreateGroupDto ) {
  const { name, participants } = createGroupDto;

  // Use Prisma to create a new chat group
  const chat = await this.prisma.chat.create({
    data: {
      name,
      type: 'group', // Assuming this is a group chat
      participants: {
        connect: participants.map((id) => ({ id })), // Connect existing user IDs
      },
    },
    include: {
      participants: true, // Include participants in the response if needed
    },
  });

  return chat;
}

async getUserGroups(userId: number) {
  return await this.prisma.chat.findMany({
    where: {
      type: 'group',
      participants: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      participants: true,
    },
  });
}

async getChat(chatId: number) {
  const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
          participants: true,
          messages: {
              orderBy: {
                  createdAt: 'asc', // Order messages by time
              },
              select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  image: true, // Assuming image is stored as bytes (Buffer)
                  senderId: true, // Include senderId
              },
          },
      },
  });

  if (chat && chat.messages) {
      const messagesWithBase64Images = chat.messages.map((message: any) => {
          if (message.image) {
              const imageBuffer = Buffer.from(message.image); 
              message.image = imageBuffer.toString('base64'); 
          }
          return message;
      });

      chat.messages = messagesWithBase64Images; // Update chat object with Base64 images
  }

  return chat;
}
async deleteChat(chatId: number) {
  try {
    // Delete all messages related to the chat first
    await this.prisma.message.deleteMany({
      where: {
        chatId: chatId,
      },
    });

    // Now delete the chat itself
    const deletedChat = await this.prisma.chat.delete({
      where: {
        id: chatId,
      },
    });
    console.log('Chat deleted successfully:', deletedChat);
    return deletedChat;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error; // Rethrow the error to handle it upstream
  }
}

}
