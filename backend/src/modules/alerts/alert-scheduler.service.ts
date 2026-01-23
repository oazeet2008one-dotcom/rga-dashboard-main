import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlertService } from './alert.service';

// =============================================================================
// Alert Scheduler Service - Watchdog for Automated Alert Checking
// =============================================================================

@Injectable()
export class AlertSchedulerService {
    private readonly logger = new Logger(AlertSchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly alertService: AlertService,
    ) { }

    // =========================================================================
    // Scheduled Jobs
    // =========================================================================

    /**
     * Run alert checks every hour for all active tenants
     * 
     * This is the "Watchdog" that monitors campaign metrics and
     * triggers alerts when thresholds are breached.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async runScheduledAlertCheck() {
        this.logger.log('🔔 Starting scheduled alert check...');

        try {
            // Fetch all active tenants
            const tenants = await this.prisma.tenant.findMany({
                where: {
                    subscriptionStatus: 'ACTIVE',
                },
                select: {
                    id: true,
                    name: true,
                },
            });

            this.logger.log(`Checking alerts for ${tenants.length} tenants...`);

            let totalAlerts = 0;
            let tenantsWithAlerts = 0;

            // Process each tenant
            for (const tenant of tenants) {
                try {
                    const alerts = await this.alertService.checkAlerts(tenant.id);

                    if (alerts.length > 0) {
                        totalAlerts += alerts.length;
                        tenantsWithAlerts++;
                        this.logger.log(
                            `Created ${alerts.length} alerts for tenant "${tenant.name}" (${tenant.id})`
                        );
                    }
                } catch (error) {
                    // Log error but continue with other tenants
                    this.logger.error(
                        `Alert check failed for tenant ${tenant.id}`,
                        error instanceof Error ? error.stack : error,
                    );
                }
            }

            this.logger.log(
                `✅ Scheduled alert check completed: ` +
                `${totalAlerts} alerts created for ${tenantsWithAlerts}/${tenants.length} tenants`
            );
        } catch (error) {
            this.logger.error(
                'Failed to run scheduled alert check',
                error instanceof Error ? error.stack : error,
            );
        }
    }

    // =========================================================================
    // Manual Trigger (for testing/admin)
    // =========================================================================

    /**
     * Manually trigger alert check for a specific tenant
     * Can be called from controller for admin/testing purposes
     */
    async triggerAlertCheck(tenantId: string) {
        this.logger.log(`Manual alert check triggered for tenant ${tenantId}`);
        return this.alertService.checkAlerts(tenantId);
    }

    /**
     * Manually trigger alert check for ALL tenants
     * Useful for testing or after bulk data import
     */
    async triggerAlertCheckForAllTenants() {
        this.logger.log('Manual alert check triggered for ALL tenants');
        await this.runScheduledAlertCheck();
        return { message: 'Alert check completed for all tenants' };
    }
}
