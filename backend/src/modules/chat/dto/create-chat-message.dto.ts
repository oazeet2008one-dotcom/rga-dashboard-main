
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateChatMessageDto {
    @IsUUID()
    @IsNotEmpty()
    sessionId: string;

    @IsString()
    @IsNotEmpty()
    role: string; // 'user' | 'assistant'

    @IsString()
    @IsNotEmpty()
    content: string;
}
