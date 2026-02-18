import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { CreateUserBehaviorDto } from './dto/create-user-behavior.dto';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { ListUserBehaviorQuery } from './dto/list-user-behavior.query';
import { ListAiRecommendationsQuery } from './dto/list-ai-recommendations.query';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('behavior')
  async createBehavior(
    @Body() dto: CreateUserBehaviorDto,
    @Request() req: any,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.aiService.createUserBehavior(tenantId, userId, dto);
  }

  @Get('behavior')
  async listBehavior(@Query() query: ListUserBehaviorQuery, @Request() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    return this.aiService.listUserBehavior(tenantId, userId, query);
  }

  @Post('recommendations')
  async createRecommendation(
    @Body() dto: CreateAiRecommendationDto,
    @Request() req: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.aiService.createAiRecommendation(tenantId, dto);
  }

  @Get('recommendations')
  async listRecommendations(
    @Query() query: ListAiRecommendationsQuery,
    @Request() req: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.aiService.listAiRecommendations(tenantId, query);
  }
}
