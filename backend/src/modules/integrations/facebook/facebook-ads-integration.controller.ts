import { Controller, Get, Delete, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FacebookAdsOAuthService } from './facebook-ads-oauth.service';

/**
 * Facebook Ads Integration Controller
 * 
 * Provides status and disconnect endpoints for Facebook Ads integration.
 * Follows standardized IntegrationStatusResponse format.
 */
@ApiTags('integrations/facebook-ads')
@ApiBearerAuth()
@Controller('integrations/facebook-ads')
@UseGuards(JwtAuthGuard)
export class FacebookAdsIntegrationController {
    constructor(
        private readonly oauthService: FacebookAdsOAuthService,
    ) { }

    /**
     * Check Facebook Ads integration status
     * Returns standardized IntegrationStatusResponse
     */
    @Get('status')
    @ApiOperation({ summary: 'Check Facebook Ads integration status' })
    @ApiResponse({
        status: 200,
        description: 'Integration status with connected accounts',
        schema: {
            properties: {
                isConnected: { type: 'boolean', example: true },
                lastSyncAt: { type: 'string', format: 'date-time', nullable: true },
                accounts: {
                    type: 'array',
                    items: {
                        properties: {
                            id: { type: 'string', description: 'Internal DB ID' },
                            externalId: { type: 'string', description: 'Facebook Account ID (act_xxx)' },
                            name: { type: 'string', description: 'Account display name' },
                            status: { type: 'string', example: 'ACTIVE' },
                        },
                    },
                },
            },
        },
    })
    async getStatus(@Req() req: any) {
        const tenantId = req.user.tenantId;

        const accounts = await this.oauthService.getConnectedAccounts(tenantId);

        // Map to standardized IntegrationStatusResponse format
        const mappedAccounts = accounts.map(account => ({
            id: account.id,
            externalId: account.accountId,       // Map accountId -> externalId
            name: account.accountName || 'Unnamed Account',
            status: account.status,
        }));

        // Get latest sync time across all accounts
        const lastSyncAt = accounts.length > 0
            ? accounts
                .map(a => a.lastSyncAt)
                .filter(Boolean)
                .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null
            : null;

        return {
            isConnected: accounts.length > 0,
            lastSyncAt,
            accounts: mappedAccounts,
        };
    }

    /**
     * Get connected Facebook Ads accounts
     */
    @Get('accounts')
    @ApiOperation({ summary: 'Get connected Facebook Ads accounts' })
    async getConnectedAccounts(@Req() req: any) {
        const tenantId = req.user.tenantId;
        const accounts = await this.oauthService.getConnectedAccounts(tenantId);

        return {
            accounts: accounts.map(account => ({
                id: account.id,
                externalId: account.accountId,
                name: account.accountName || 'Unnamed Account',
                status: account.status,
                lastSyncAt: account.lastSyncAt,
                createdAt: account.createdAt,
            })),
        };
    }

    /**
     * Disconnect Facebook Ads integration
     * Removes all connected accounts for the tenant
     */
    @Delete()
    @ApiOperation({ summary: 'Disconnect Facebook Ads integration' })
    @ApiResponse({
        status: 200,
        description: 'Successfully disconnected',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Facebook Ads disconnected successfully' },
            },
        },
    })
    async disconnect(@Req() req: any) {
        const tenantId = req.user.tenantId;

        await this.oauthService.disconnect(tenantId);

        return {
            success: true,
            message: 'Facebook Ads disconnected successfully',
        };
    }
}
