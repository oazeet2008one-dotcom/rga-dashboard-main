import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserBehaviorDto } from './dto/create-user-behavior.dto';
import { ListUserBehaviorQuery } from './dto/list-user-behavior.query';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { ListAiRecommendationsQuery } from './dto/list-ai-recommendations.query';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserBehavior(tenantId: string, userId: string, dto: CreateUserBehaviorDto) {
    return this.prisma.userBehavior.create({
      data: {
        tenantId,
        userId,
        action: dto.action,
        data: dto.data ?? undefined,
      },
    });
  }

  async listUserBehavior(tenantId: string, userId: string, query: ListUserBehaviorQuery) {
    const limit = Math.min(query.limit ?? 50, 200);

    const where: any = {
      tenantId,
      userId,
      ...(query.action ? { action: query.action } : {}),
    };

    const rows = await this.prisma.userBehavior.findMany({
      where,
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      orderBy: { timestamp: 'desc' },
    });

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
    };
  }

  async createAiRecommendation(tenantId: string, dto: CreateAiRecommendationDto) {
    return this.prisma.aiRecommendation.create({
      data: {
        tenantId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        confidence: dto.confidence ?? 0,
        status: dto.status ?? 'PENDING',
        payload: dto.payload ?? undefined,
      },
    });
  }

  async listAiRecommendations(tenantId: string, query: ListAiRecommendationsQuery) {
    const limit = Math.min(query.limit ?? 50, 200);

    const where: any = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const rows = await this.prisma.aiRecommendation.findMany({
      where,
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
    };
  }
}
