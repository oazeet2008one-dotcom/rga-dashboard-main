import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { GoogleSearchConsoleService } from './google-search-console.service';
import { SeoSyncSchedulerService } from './seo-sync-scheduler.service';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [SeoController],
    providers: [SeoService, GoogleSearchConsoleService, SeoSyncSchedulerService],
    exports: [SeoService],
})
export class SeoModule { }
