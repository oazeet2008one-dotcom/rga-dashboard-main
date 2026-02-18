import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserBehaviorDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsOptional()
  data?: any;
}
