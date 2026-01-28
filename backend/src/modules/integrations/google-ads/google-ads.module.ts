import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { SyncModule } from '../../sync/sync.module';
import { CommonModule } from '../../../common/common.module';
import { GoogleAdsAuthController } from './google-ads-auth.controller';
import { GoogleAdsCampaignController } from './google-ads-campaign.controller';
import { GoogleAdsIntegrationController } from './google-ads-integration.controller';
import { GoogleAdsOAuthService } from './google-ads-oauth.service';
import { GoogleAdsCampaignService } from './google-ads-campaign.service';
import { GoogleAdsClientService } from './services/google-ads-client.service';
import { GoogleAdsApiService } from './services/google-ads-api.service';
import { GoogleAdsMapperService } from './services/google-ads-mapper.service';
import { GoogleAdsService } from './google-ads.service';
import { GoogleAdsSyncService } from './services/google-ads-sync.service';
import { DashboardModule } from '../../dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HttpModule,
    CommonModule, // 🔑 Provides EncryptionService for token decryption
    forwardRef(() => SyncModule),
    DashboardModule,
  ],
  controllers: [
    GoogleAdsAuthController,
    GoogleAdsCampaignController,
    GoogleAdsIntegrationController
  ],
  providers: [
    GoogleAdsOAuthService,
    GoogleAdsCampaignService,
    GoogleAdsClientService,
    GoogleAdsApiService,
    GoogleAdsMapperService,
    GoogleAdsService,
    GoogleAdsSyncService,
  ],
  exports: [
    GoogleAdsOAuthService,
    GoogleAdsCampaignService,
    GoogleAdsClientService,
    GoogleAdsApiService,
    GoogleAdsMapperService,
    GoogleAdsService,
    GoogleAdsSyncService,
  ],
})
export class GoogleAdsModule { }
