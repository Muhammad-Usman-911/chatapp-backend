    import { IsString, IsInt, IsOptional, IsNotEmpty, IsArray } from 'class-validator';

    export class TypingDto {
    @IsInt()
    @IsNotEmpty()
    userId: number;

    @IsInt()
    @IsNotEmpty()
    chatId: number;
     
    @IsNotEmpty()
    typing:boolean;
    
    @IsInt()
    @IsOptional()  // Marks receiverId as optional
    receiverId?: number | null;
    
    @IsArray()
    @IsOptional()
    participants: { id: number; name: string; email: string; verified: boolean }[]; 
    
}
