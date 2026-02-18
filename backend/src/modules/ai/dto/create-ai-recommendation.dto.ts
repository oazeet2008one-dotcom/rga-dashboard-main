import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAiRecommendationDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  payload?: any;
}
