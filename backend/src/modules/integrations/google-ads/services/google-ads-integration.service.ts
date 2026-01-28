import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleAdsOAuthService } from '../google-ads-oauth.service';
import { GoogleAdsClientService } from './google-ads-client.service';
import { ConnectGoogleAdsDto } from '../dto';

/**
 * TODO: Refactor in Sprint 3
 * 
 * This service uses a non-existent 'APIConnection' model that was removed in Schema V2.
 * The legacy connect() method has been commented out.
 * 
 * New connection flow should use:
 * - GoogleAdsOAuthService.handleCallback() for OAuth flow
 * - GoogleAdsOAuthService.completeConnection() to save account
 */
@Injectable()
export class GoogleAdsIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oauthService: GoogleAdsOAuthService,
    private readonly clientService: GoogleAdsClientService,
  ) { }

  /**
   * @deprecated Legacy connect() method removed in Sprint 3.
   * Use GoogleAdsOAuthService.handleCallback() + completeConnection() for new OAuth flow.
   */

  async getAuthUrl(userId: string, tenantId: string) {
    return {
      authUrl: await this.oauthService.generateAuthUrl(userId, tenantId),
    };
  }
}
