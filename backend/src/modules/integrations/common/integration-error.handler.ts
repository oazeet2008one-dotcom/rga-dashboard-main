import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IntegrationErrorHandler {
    private readonly logger = new Logger(IntegrationErrorHandler.name);

    /**
     * Executes an integration operation with graceful error handling
     * @param operation The async operation to execute (e.g. fetchCampaigns)
     * @param fallbackValue Value to return if operation fails
     * @param context Context for logging (e.g., 'GoogleAds.fetchCampaigns')
     */
    async handle<T>(
        operation: () => Promise<T>,
        fallbackValue: T,
        context: string
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            this.handleError(error, context);
            return fallbackValue;
        }
    }

    private handleError(error: any, context: string) {
        // Detect specific error types
        const isTokenExpired = this.isTokenExpired(error);
        const isNetworkError = this.isNetworkError(error);

        if (isTokenExpired) {
            this.logger.warn(`[${context}] Token Expired: ${error.message}`);
            // Todo: Trigger notification or mark integration as 'NEEDS_RECONNECT' via EventBus
        } else if (isNetworkError) {
            this.logger.warn(`[${context}] Network Error: ${error.message}`);
        } else {
            this.logger.error(`[${context}] Unexpected Error: ${error.message}`, error.stack);
        }
    }

    private isTokenExpired(error: any): boolean {
        const msg = error.message?.toLowerCase() || '';
        return (
            msg.includes('token expired') ||
            msg.includes('unauthorized') ||
            msg.includes('invalid_grant') ||
            (error.response?.status === 401)
        );
    }

    private isNetworkError(error: any): boolean {
        const msg = error.message?.toLowerCase() || '';
        return (
            msg.includes('econnrefused') ||
            msg.includes('timeout') ||
            msg.includes('network error')
        );
    }
}
