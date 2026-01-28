import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleAdsClientService } from './google-ads-client.service';
import { EncryptionService } from '../../../../common/services/encryption.service';

/**
 * GoogleAdsApiService
 * 
 * PURPOSE:
 * Handles Google Ads API operations using the GoogleAdsClientService.
 * 
 * CRITICAL CONFIGURATION:
 * - `login_customer_id` MUST be the MCC (Manager) Account ID for Standard/Test Access
 * - `customer_id` is the Target (Child) Account we are querying
 * - This "impersonation" pattern is REQUIRED when using MCC-based access
 * 
 * CRITICAL - TOKEN ENCRYPTION:
 * - Tokens stored in database are ENCRYPTED using EncryptionService
 * - MUST decrypt tokens before passing to Google APIs
 * - Failure to decrypt causes "invalid_grant" error
 * 
 * ARCHITECTURE:
 * - This service delegates API calls to GoogleAdsClientService.getCustomer()
 * - GoogleAdsClientService handles the correct header configuration
 * - OAuth2Client is created per-request to avoid singleton state pollution
 */
@Injectable()
export class GoogleAdsApiService {
    private readonly logger = new Logger(GoogleAdsApiService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly googleAdsClientService: GoogleAdsClientService,
        private readonly encryptionService: EncryptionService, // 🔑 CRITICAL: For decrypting tokens
    ) {
        // Startup validation: Log configuration status
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const developerToken = this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN');
        const mccLoginCustomerId = this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
        const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI_ADS');

        this.logger.log(`Initializing GoogleAdsApiService:`);
        this.logger.log(`- Client ID: ${clientId?.substring(0, 10)}...`);
        this.logger.log(`- Developer Token: ${developerToken ? 'SET' : '⚠️ MISSING'}`);
        this.logger.log(`- MCC Login Customer ID: ${mccLoginCustomerId || '⚠️ MISSING'}`);
        this.logger.log(`- Redirect URI: ${redirectUri}`);

        // Critical validation
        if (!developerToken) {
            this.logger.error('❌ CRITICAL: GOOGLE_ADS_DEVELOPER_TOKEN is not configured!');
        }
        if (!mccLoginCustomerId) {
            this.logger.warn('⚠️ WARNING: GOOGLE_ADS_LOGIN_CUSTOMER_ID is not configured. MCC-based access will fail.');
        }
    }

    /**
     * Create a fresh OAuth2Client for each request
     * IMPORTANT: This prevents singleton state pollution / race conditions
     */
    private createOAuthClient() {
        return new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_SECRET'),
            this.configService.get('GOOGLE_REDIRECT_URI_ADS'),
        );
    }

    /**
     * Decrypt refresh token from database
     * CRITICAL: Tokens in DB are encrypted, must decrypt before use!
     */
    private decryptRefreshToken(encryptedToken: string): string {
        try {
            return this.encryptionService.decrypt(encryptedToken);
        } catch (error: any) {
            this.logger.error(`Failed to decrypt refresh token: ${error.message}`);
            throw new BadRequestException('Failed to decrypt token. Token may be corrupted.');
        }
    }

    /**
     * Refresh access token if expired or about to expire
     * 
     * @param account - GoogleAdsAccount record from database
     */
    async refreshTokenIfNeeded(account: any): Promise<void> {
        const now = new Date();
        const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer

        const shouldRefresh =
            !account.tokenExpiresAt ||
            account.tokenExpiresAt < now ||
            (account.tokenExpiresAt.getTime() - expiryBuffer) < now.getTime() ||
            !account.accessToken;

        if (shouldRefresh && account.refreshToken) {
            try {
                this.logger.log(`[Token Refresh] Checking status for account ${account.id}:`);
                this.logger.log(`- Now: ${now.toISOString()}`);
                this.logger.log(`- ExpiresAt: ${account.tokenExpiresAt ? account.tokenExpiresAt.toISOString() : 'NULL'}`);

                this.logger.log(`Refreshing token for account ${account.id}`);

                // 🔑 CRITICAL FIX: Decrypt the refresh token before use!
                const decryptedRefreshToken = this.decryptRefreshToken(account.refreshToken);

                // Use fresh client per request (stateless)
                const oauth2Client = this.createOAuthClient();
                oauth2Client.setCredentials({
                    refresh_token: decryptedRefreshToken, // ✅ Use DECRYPTED token
                });

                const { credentials } = await oauth2Client.refreshAccessToken();

                // Store encrypted access token back to DB
                await this.prisma.googleAdsAccount.update({
                    where: { id: account.id },
                    data: {
                        accessToken: this.encryptionService.encrypt(credentials.access_token),
                        tokenExpiresAt: credentials.expiry_date
                            ? new Date(credentials.expiry_date)
                            : null,
                    },
                });

                // Update account object in memory (keep encrypted for consistency)
                account.accessToken = this.encryptionService.encrypt(credentials.access_token);
                account.tokenExpiresAt = credentials.expiry_date
                    ? new Date(credentials.expiry_date)
                    : null;

                this.logger.log(`Token refreshed successfully for account ${account.id}`);
            } catch (error: any) {
                this.logger.error(`Failed to refresh token: ${error.message}`);
                throw new BadRequestException(
                    'Token expired and refresh failed. Please reconnect your Google Ads account.',
                );
            }
        }
    }

    /**
     * Fetch campaigns from Google Ads API
     * 
     * CRITICAL: This method uses GoogleAdsClientService.getCustomer() which correctly sets:
     * - customer_id = account.customerId (Target Child Account)
     * - login_customer_id = GOOGLE_ADS_LOGIN_CUSTOMER_ID from config (MCC ID)
     * 
     * @param account - GoogleAdsAccount record from database
     * @returns Array of campaign data from Google Ads API
     */
    async fetchCampaigns(account: any) {
        if (!account || !account.refreshToken) {
            throw new Error('Google Ads account not found or not connected');
        }

        // Validate MCC configuration before making API call
        const mccLoginCustomerId = this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
        if (!mccLoginCustomerId) {
            this.logger.warn(`[fetchCampaigns] WARNING: GOOGLE_ADS_LOGIN_CUSTOMER_ID not set. API call may fail.`);
        }

        await this.refreshTokenIfNeeded(account);

        // 🔑 CRITICAL FIX: Decrypt the refresh token before passing to API!
        const decryptedRefreshToken = this.decryptRefreshToken(account.refreshToken);

        // ================================================================
        // CRITICAL: getCustomer() uses MCC ID as login_customer_id
        // This enables "impersonation" required for Standard/Test Access
        // ================================================================
        const customer = this.googleAdsClientService.getCustomer(
            account.customerId,       // Target (Child) Account ID
            decryptedRefreshToken,    // ✅ Use DECRYPTED token
        );

        const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
      ORDER BY campaign.id
    `;

        try {
            this.logger.debug(`[fetchCampaigns] Querying Google Ads API for account ${account.customerId}`);
            const results = await customer.query(query);
            this.logger.log(`[fetchCampaigns] Retrieved ${results.length} campaigns`);
            return results;
        } catch (error: any) {
            this.logger.error(`Google Ads API Error: ${error.message}`);

            // Enhanced error diagnosis
            if (error.message?.includes('invalid_grant')) {
                this.logger.error(`[fetchCampaigns] DIAGNOSIS: invalid_grant error detected.`);
                this.logger.error(`  - Customer ID: ${account.customerId}`);
                this.logger.error(`  - MCC Login ID: ${mccLoginCustomerId || 'NOT SET'}`);
                this.logger.error(`  - Possible causes:`);
                this.logger.error(`    1. Refresh token is expired/revoked`);
                this.logger.error(`    2. Token decryption failed`);
                this.logger.error(`    3. MCC does not have access to this child account`);
            }

            throw new Error(`Failed to fetch campaigns: ${error.message}`);
        }
    }

    /**
     * Fetch campaign metrics from Google Ads API for a specific date range
     * 
     * @param account - GoogleAdsAccount record from database
     * @param campaignId - Google Ads Campaign ID
     * @param startDate - Start date for metrics
     * @param endDate - End date for metrics
     * @returns Array of daily metrics
     */
    async fetchCampaignMetrics(
        account: any,
        campaignId: string,
        startDate: Date,
        endDate: Date,
    ) {
        if (!account.refreshToken) {
            throw new BadRequestException('Account not authenticated. Please reconnect your Google Ads account.');
        }

        await this.refreshTokenIfNeeded(account);

        try {
            // 🔑 CRITICAL FIX: Decrypt the refresh token before passing to API!
            const decryptedRefreshToken = this.decryptRefreshToken(account.refreshToken);

            // ================================================================
            // CRITICAL: getCustomer() uses MCC ID as login_customer_id
            // ================================================================
            const customer = this.googleAdsClientService.getCustomer(
                account.customerId,       // Target (Child) Account ID
                decryptedRefreshToken,    // ✅ Use DECRYPTED token
            );

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const metrics = await customer.query(`
        SELECT
          campaign.id,
          campaign.name,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
        WHERE
          campaign.id = ${campaignId}
          AND campaign.status != 'REMOVED'
          AND segments.date >= '${startDateStr}'
          AND segments.date <= '${endDateStr}'
        ORDER BY segments.date ASC
      `);

            this.logger.log(`Fetched ${metrics.length} metric records`);
            return metrics;
        } catch (error: any) {
            this.handleApiError(error, account.id, campaignId);
            return []; // Should not reach here due to throw in handleApiError
        }
    }

    /**
     * Centralized error handler for Google Ads API errors
     * Provides detailed diagnosis and user-friendly messages
     */
    private handleApiError(error: any, accountId: string, campaignId: string) {
        this.logger.error('Raw Google Ads API Error:', JSON.stringify(error, null, 2));

        let errorMessage = 'Unknown error';
        let errorCode = null;

        if (error) {
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
                errorMessage = error.errors.map((e: any) => e.message).join(', ');
                errorCode = error.errors[0].errorCode;
            } else if (error.toString && error.toString() !== '[object Object]') {
                errorMessage = error.toString();
            }

            errorCode = errorCode || error.code || error.status || null;

            // User-friendly error mapping
            if (errorMessage === 'invalid_grant') {
                const mccLoginCustomerId = this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
                errorMessage = 'Token expired or invalid. Please reconnect your Google Ads account.';
                this.logger.warn(`Token expired for account ${accountId}. User needs to reconnect.`);
                this.logger.warn(`DIAGNOSIS: MCC Login ID = ${mccLoginCustomerId || 'NOT SET'}`);
            } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
                errorMessage = 'Permission denied. Please check account access permissions.';
            } else if (errorMessage.includes('developer_token')) {
                errorMessage = 'Invalid developer token. Please check GOOGLE_ADS_DEVELOPER_TOKEN.';
            } else if (errorMessage.includes('customer_id')) {
                errorMessage = 'Invalid customer ID. Please check customer ID format.';
            } else if (errorMessage.includes('login_customer_id')) {
                errorMessage = 'Invalid login customer ID (MCC). Please check GOOGLE_ADS_LOGIN_CUSTOMER_ID.';
            } else if (errorMessage.includes('decrypt')) {
                errorMessage = 'Token decryption failed. The stored token may be corrupted.';
            }
        }

        const descriptiveError = new Error(`Failed to fetch metrics: ${errorMessage}`);
        (descriptiveError as any).code = errorCode;
        (descriptiveError as any).originalError = error;
        throw descriptiveError;
    }
}
