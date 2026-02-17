import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'john' })
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,30}$/, {
    message: 'Username must be 3-30 characters and contain only letters, numbers, dot, underscore, or dash.',
  })
  username: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'My Company' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  termsAccepted: boolean;
}

