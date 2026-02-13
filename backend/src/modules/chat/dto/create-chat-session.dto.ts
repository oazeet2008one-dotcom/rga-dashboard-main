
import { IsOptional, IsString } from 'class-validator';

export class CreateChatSessionDto {
    @IsString()
    @IsOptional()
    title?: string;
}
