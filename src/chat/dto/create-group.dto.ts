import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  participants: number[]; // Array of user IDs
}
