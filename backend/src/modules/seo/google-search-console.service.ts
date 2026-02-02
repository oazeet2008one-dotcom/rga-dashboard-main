import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleSearchConsoleService {
    private readonly logger = new Logger(GoogleSearchConsoleService.name);

    constructor(private readonly configService: ConfigService) { }

    getSiteUrl(tenantSettings?: any): string | null {
        const fromTenant = tenantSettings?.seo?.gscSiteUrl;
        const fromEnv = this.configService.get<string>('GSC_SITE_URL');
        return (fromTenant || fromEnv || null) as string | null;
    }

    hasCredentials(): boolean {
        const json = this.configService.get<string>('GSC_SERVICE_ACCOUNT_JSON');
        const keyFile = this.configService.get<string>('GSC_SERVICE_ACCOUNT_KEY_FILE');
        return !!(json || keyFile);
    }

    private getAuth() {
        const json = this.configService.get<string>('GSC_SERVICE_ACCOUNT_JSON');
        const keyFile = this.configService.get<string>('GSC_SERVICE_ACCOUNT_KEY_FILE');
        const scopes = ['https://www.googleapis.com/auth/webmasters.readonly'];

        if (json) {
            try {
                const credentials = JSON.parse(json);
                return new google.auth.GoogleAuth({ credentials, scopes });
            } catch (error: any) {
                throw new Error(`Invalid GSC_SERVICE_ACCOUNT_JSON: ${error.message}`);
            }
        }

        if (keyFile) {
            return new google.auth.GoogleAuth({ keyFile, scopes });
        }

        throw new Error('GSC credentials not configured');
    }

    async querySearchAnalytics(params: {
        siteUrl: string;
        startDate: string;
        endDate: string;
        rowLimit?: number;
        startRow?: number;
        dimensions?: string[];
    }) {
        const auth = this.getAuth();

        const searchconsole = google.searchconsole({
            version: 'v1',
            auth,
        });

        try {
            const response = await searchconsole.searchanalytics.query({
                siteUrl: params.siteUrl,
                requestBody: {
                    startDate: params.startDate,
                    endDate: params.endDate,
                    dimensions: params.dimensions ?? ['date', 'page', 'query', 'device', 'country'],
                    startRow: params.startRow ?? 0,
                    rowLimit: params.rowLimit ?? 25000,
                },
            });

            return response.data;
        } catch (error: any) {
            this.logger.error(`GSC query failed: ${error.message}`);
            throw error;
        }
    }
}
