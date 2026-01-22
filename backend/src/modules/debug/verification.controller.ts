import { Body, Controller, ForbiddenException, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerificationSeeder } from '../mock-data/generators/verification-seeder';
import { AlertSchedulerService } from '../alerts/alert-scheduler.service';

@ApiTags('Verification')
@ApiBearerAuth()
@Controller('verify')
@UseGuards(JwtAuthGuard)
export class VerificationController {
    private readonly logger = new Logger(VerificationController.name);

    constructor(
        private readonly verificationSeeder: VerificationSeeder,
        private readonly alertSchedulerService: AlertSchedulerService,
    ) { }

    private ensureNotProduction() {
        if (process.env.NODE_ENV === 'production') {
            throw new ForbiddenException('Verification endpoints are disabled in production environment');
        }
    }

    @Post('seed-heavy')
    @ApiOperation({ summary: 'Seed heavy campaigns (10,000+ rows) for export/alert verification' })
    @ApiBody({ schema: { properties: { count: { type: 'number', default: 10000 } } }, required: false })
    async seedHeavy(
        @CurrentUser('tenantId') tenantId: string,
        @Body('count') count?: number,
    ) {
        this.ensureNotProduction();
        const requested = typeof count === 'number' && Number.isFinite(count) ? count : 10000;

        this.logger.log(`[VERIFY] seed-heavy → tenantId=${tenantId}, count=${requested}`);
        return this.verificationSeeder.seedHeavyCampaigns(tenantId, requested);
    }

    @Post('trigger-alert-now')
    @ApiOperation({ summary: 'Force immediate alert evaluation (manual cron trigger)' })
    async triggerAlertNow(@CurrentUser('email') email: string) {
        this.ensureNotProduction();
        this.logger.log(`[VERIFY] trigger-alert-now → ${email}`);

        const anyScheduler = this.alertSchedulerService as any;

        if (typeof anyScheduler.handleCron === 'function') {
            await anyScheduler.handleCron();
            return { success: true, message: 'Alert cron triggered (handleCron)' };
        }

        if (typeof anyScheduler.runScheduledAlertCheck === 'function') {
            await anyScheduler.runScheduledAlertCheck();
            return { success: true, message: 'Alert cron triggered (runScheduledAlertCheck)' };
        }

        if (typeof anyScheduler.triggerAlertCheckForAllTenants === 'function') {
            return anyScheduler.triggerAlertCheckForAllTenants();
        }

        throw new Error('No runnable alert scheduler method found');
    }

    @Get('memory-check')
    @ApiOperation({ summary: 'Return Node.js process memory usage' })
    async memoryCheck() {
        return process.memoryUsage();
    }
}
