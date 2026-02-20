/**
 * =============================================================================
 * Toolkit HTTP Controller (Internal API)
 * =============================================================================
 *
 * Thin transport layer for toolkit operations via HTTP.
 * Business execution is delegated to ToolkitCommandExecutorService.
 * =============================================================================
 */

import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    BadRequestException,
    HttpException,
    ForbiddenException,
    UnprocessableEntityException,
    InternalServerErrorException,
    UseGuards,
    UsePipes,
} from '@nestjs/common';
import {
    createAlertScenarioCommand,
    createResetTenantCommand,
    createResetTenantHardCommand,
} from '../commands';
import { Result } from '../core/contracts';
import {
    AlertScenarioDto,
    GetAlertHistoryQueryDto,
    GetAlertsQueryDto,
    GetMetricsQueryDto,
    ResetTenantDto,
    ResetTenantHardDto,
    ResetTenantHardTokenDto,
} from './dto';
import { ToolkitCommandExecutorService } from './toolkit-command-executor.service';
import { ToolkitInternalGuard } from './toolkit-internal.guard';
import { ToolkitQueryService } from './toolkit-query.service';
import { createToolkitValidationPipe } from './toolkit-validation.pipe';

interface ToolkitResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

@Controller('internal')
@UseGuards(ToolkitInternalGuard)
@UsePipes(createToolkitValidationPipe())
export class ToolkitController {
    constructor(
        private readonly queryService: ToolkitQueryService,
        private readonly commandExecutor: ToolkitCommandExecutorService,
    ) { }

    @Get('metrics')
    async getMetrics(@Query() query: GetMetricsQueryDto): Promise<ToolkitResponse<unknown>> {
        const data = await this.queryService.getMetrics(query);

        return {
            success: true,
            data,
        };
    }

    @Get('alerts')
    async getAlerts(@Query() query: GetAlertsQueryDto): Promise<ToolkitResponse<unknown>> {
        const data = await this.queryService.getAlerts(query);

        return {
            success: true,
            data,
        };
    }

    @Get('alerts/history')
    async getAlertHistory(
        @Query() query: GetAlertHistoryQueryDto,
    ): Promise<ToolkitResponse<unknown>> {
        const data = await this.queryService.getAlertHistory(query);

        return {
            success: true,
            data,
        };
    }

    @Post('alert-scenario')
    @HttpCode(HttpStatus.OK)
    async runAlertScenario(
        @Body() dto: AlertScenarioDto,
    ): Promise<ToolkitResponse<unknown>> {
        const command = createAlertScenarioCommand(dto.tenantId, {
            seedBaseline: dto.seedBaseline,
            injectAnomaly: dto.injectAnomaly,
            days: dto.days,
        });

        const result = await this.commandExecutor.executeCommand(command, {
            tenantId: dto.tenantId,
            dryRun: dto.dryRun,
        });

        return this.mapResultToResponse(result);
    }

    @Post('reset-tenant')
    @HttpCode(HttpStatus.OK)
    async resetTenant(
        @Body() dto: ResetTenantDto,
    ): Promise<ToolkitResponse<unknown>> {
        const command = createResetTenantCommand(dto.tenantId);
        const result = await this.commandExecutor.executeCommand(command, {
            tenantId: dto.tenantId,
            dryRun: dto.dryRun,
        });

        return this.mapResultToResponse(result);
    }

    @Post('reset-tenant/hard/token')
    @HttpCode(HttpStatus.OK)
    async generateResetTenantHardToken(
        @Body() dto: ResetTenantHardTokenDto,
    ): Promise<ToolkitResponse<{ token: string; expiresAt: string }>> {
        const issued = this.commandExecutor.issueHardResetToken(dto.tenantId);

        return {
            success: true,
            data: {
                token: issued.token,
                expiresAt: issued.expiresAt.toISOString(),
            },
        };
    }

    @Post('reset-tenant/hard')
    @HttpCode(HttpStatus.OK)
    async resetTenantHard(
        @Body() dto: ResetTenantHardDto,
    ): Promise<ToolkitResponse<unknown>> {
        const command = createResetTenantHardCommand(dto.tenantId, {
            mode: 'HARD',
            confirmedAt: new Date(dto.confirmedAt),
            confirmationToken: dto.confirmationToken,
        });

        const result = await this.commandExecutor.executeCommand(command, {
            tenantId: dto.tenantId,
            dryRun: dto.dryRun,
        });

        return this.mapResultToResponse(result);
    }

    private mapResultToResponse<T>(result: Result<T>): ToolkitResponse<T> {
        if (result.kind === 'success') {
            return { success: true, data: result.value };
        }

        const error = result.error;

        if (error.code === 'VALIDATION_ERROR') {
            throw new BadRequestException(error.message);
        }
        if (error.code === 'SAFETY_BLOCK') {
            throw new ForbiddenException(error.message);
        }
        if (error.code === 'CONCURRENCY_LIMIT') {
            throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
        }
        if (error.isRecoverable) {
            throw new UnprocessableEntityException({ code: error.code, message: error.message });
        }

        throw new InternalServerErrorException(error.message);
    }
}
