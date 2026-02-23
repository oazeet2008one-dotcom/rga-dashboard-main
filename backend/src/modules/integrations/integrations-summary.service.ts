import { Injectable } from '@nestjs/common';
import { AdPlatform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: {
        tenantId,
        isActive: true,
        status: 'CONNECTED',
      },
      select: {
        type: true,
        name: true,
        status: true,
        isActive: true,
        lastSyncAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const connectedPlatforms = Array.from(
      new Set(integrations.map((i) => String(i.type))),
    );

    const hasAnyConnected = connectedPlatforms.length > 0;

    return {
      hasAnyConnected,
      connectedPlatforms,
      integrations: integrations.map((i) => ({
        type: i.type as AdPlatform,
        name: i.name,
        status: i.status,
        isActive: i.isActive,
        lastSyncAt: i.lastSyncAt,
      })),
    };
  }
}
