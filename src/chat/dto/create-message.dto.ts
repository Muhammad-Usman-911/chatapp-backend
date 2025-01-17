    import { IsString, IsInt, IsOptional, IsNotEmpty, IsArray } from 'class-validator';

    export class CreateMessageDto {
    @IsString()
    content: string;

    @IsInt()
    @IsNotEmpty()
    senderId: number;
    
    @IsString()
    msgType:string;

    @IsInt()
    @IsOptional()  // Marks receiverId as optional
    receiverId?: number | null;
    
    @IsOptional()  // Marks receiverId as optional
    image?: any | null;
    
    @IsInt()
    @IsNotEmpty()
    chatId:number;
    
    @IsArray()
    @IsOptional()
    participants: { id: number; name: string; email: string; verified: boolean }[]; // Updated type
    
}
