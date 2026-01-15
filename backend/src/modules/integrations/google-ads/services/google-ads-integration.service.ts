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
   * @deprecated This method uses a removed APIConnection model
   * TODO: Refactor in Sprint 3 - Remove or reimplement
   */
  async connect(tenantId: string, dto: ConnectGoogleAdsDto) {
    // TODO: Refactor in Sprint 3 - APIConnection model was removed in Schema V2
    // Options:
    // 1. Use GoogleAdsAccount model directly
    // 2. Create a new integration pattern
    throw new Error('Legacy connect() method is deprecated. Use OAuth flow instead.');

    /* 
    // Original broken code (APIConnection model doesn't exist):
    const connection = await this.prisma.aPIConnection.create({
      data: {
        tenantId,
        platform: 'GOOGLE_ADS',
        credentials: JSON.stringify({
          clientId: dto.clientId,
          clientSecret: dto.clientSecret,
          developerToken: dto.developerToken,
          refreshToken: dto.refreshToken,
          customerId: dto.customerId,
        }),
        isActive: true,
      },
    });

    let isValid = false;
    try {
      const customer = this.clientService.getCustomer(
        dto.customerId,
        dto.refreshToken,
      );
      await customer.query('SELECT customer.id FROM customer LIMIT 1');
      isValid = true;
    } catch (error) {
      console.error('Connection test failed:', error);
      isValid = false;
    }

    if (!isValid) {
      await this.prisma.aPIConnection.update({
        where: { id: connection.id },
        data: { isActive: false },
      });
    }

    return {
      ...connection,
      connectionValid: isValid,
    };
    */
  }

  async getAuthUrl(userId: string, tenantId: string) {
    return {
      authUrl: await this.oauthService.generateAuthUrl(userId, tenantId),
    };
  }
}
