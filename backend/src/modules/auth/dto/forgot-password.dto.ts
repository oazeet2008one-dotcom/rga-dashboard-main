import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ 
    example: 'admin@rga.com',
    description: 'User email address for password reset'
  })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'abcd1234efgh5678',
    description: 'Password reset token from email'
  })
  @IsString()
  token: string;

  @ApiProperty({ 
    example: 'NewSecurePassword123!',
    description: 'New password (min 8 characters)'
  })
  @IsString()
  newPassword: string;
}
