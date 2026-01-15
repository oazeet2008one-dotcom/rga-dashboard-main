import { IsString, IsOptional, IsEnum, MinLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'NewPassword123' })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, example: 'MANAGER' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
