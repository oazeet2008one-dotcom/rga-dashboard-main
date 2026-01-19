import { Module } from '@nestjs/common';
import { AdGroupsController } from './ad-groups.controller';
import { AdGroupsService } from './ad-groups.service';
import { AdGroupsRepository } from './ad-groups.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
    imports: [PrismaModule, AuditLogsModule],
    controllers: [AdGroupsController],
    providers: [AdGroupsService, AdGroupsRepository],
    exports: [AdGroupsService],
})
export class AdGroupsModule { }
