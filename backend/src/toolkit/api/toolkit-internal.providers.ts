import { Provider } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AlertScenarioCommandHandler } from '../commands/alert-scenario.handler';
import {
    ResetTenantCommandHandler,
    ResetTenantHardCommandHandler,
} from '../commands/reset-tenant.handler';
import { CommandRegistry } from '../core/command-registry';
import { loadConfiguration } from '../core';
import { ILogger, IToolkitConfiguration, IUiPrinter } from '../core/contracts';
import { ConsoleUiPrinter } from '../core/observability/ui-printer';
import { PinoLogger } from '../infrastructure/pino-logger';
import { AlertEngine } from '../services/alert-engine.service';
import { AlertScenarioService } from '../services/alert-scenario.service';
import { GoogleAdsSeederService } from '../services/google-ads-seeder.service';
import { TenantResetService } from '../services/tenant-reset.service';
import {
    TOOLKIT_INTERNAL_COMMAND_REGISTRY,
    TOOLKIT_INTERNAL_CONFIG,
    TOOLKIT_INTERNAL_LOGGER,
    TOOLKIT_INTERNAL_UI_PRINTER,
} from './toolkit-internal.tokens';

const toolkitConfigProvider: Provider = {
    provide: TOOLKIT_INTERNAL_CONFIG,
    useFactory: (): IToolkitConfiguration => loadConfiguration(),
};

const toolkitLoggerProvider: Provider = {
    provide: TOOLKIT_INTERNAL_LOGGER,
    useFactory: (config: IToolkitConfiguration): ILogger => {
        return new PinoLogger(config);
    },
    inject: [TOOLKIT_INTERNAL_CONFIG],
};

const toolkitUiPrinterProvider: Provider = {
    provide: TOOLKIT_INTERNAL_UI_PRINTER,
    useFactory: (): IUiPrinter => new ConsoleUiPrinter('LOCAL'),
};

const toolkitGoogleAdsSeederServiceProvider: Provider = {
    provide: GoogleAdsSeederService,
    useFactory: (logger: ILogger, prisma: PrismaService): GoogleAdsSeederService => {
        return new GoogleAdsSeederService(logger, prisma);
    },
    inject: [TOOLKIT_INTERNAL_LOGGER, PrismaService],
};

const toolkitAlertEngineProvider: Provider = {
    provide: AlertEngine,
    useFactory: (): AlertEngine => new AlertEngine(),
};

const toolkitAlertScenarioServiceProvider: Provider = {
    provide: AlertScenarioService,
    useFactory: (
        seederService: GoogleAdsSeederService,
        alertEngine: AlertEngine,
        prisma: PrismaService,
    ): AlertScenarioService => {
        return new AlertScenarioService(
            seederService,
            alertEngine,
            prisma,
        );
    },
    inject: [GoogleAdsSeederService, AlertEngine, PrismaService],
};

const toolkitTenantResetServiceProvider: Provider = {
    provide: TenantResetService,
    useFactory: (prisma: PrismaService): TenantResetService => {
        return new TenantResetService(prisma);
    },
    inject: [PrismaService],
};

const toolkitAlertScenarioCommandHandlerProvider: Provider = {
    provide: AlertScenarioCommandHandler,
    useFactory: (
        logger: ILogger,
        scenarioService: AlertScenarioService,
    ): AlertScenarioCommandHandler => {
        return new AlertScenarioCommandHandler(logger, scenarioService);
    },
    inject: [TOOLKIT_INTERNAL_LOGGER, AlertScenarioService],
};

const toolkitResetTenantCommandHandlerProvider: Provider = {
    provide: ResetTenantCommandHandler,
    useFactory: (
        logger: ILogger,
        resetService: TenantResetService,
    ): ResetTenantCommandHandler => {
        return new ResetTenantCommandHandler(logger, resetService);
    },
    inject: [TOOLKIT_INTERNAL_LOGGER, TenantResetService],
};

const toolkitResetTenantHardCommandHandlerProvider: Provider = {
    provide: ResetTenantHardCommandHandler,
    useFactory: (
        logger: ILogger,
        resetService: TenantResetService,
    ): ResetTenantHardCommandHandler => {
        return new ResetTenantHardCommandHandler(logger, resetService);
    },
    inject: [TOOLKIT_INTERNAL_LOGGER, TenantResetService],
};

const toolkitCommandRegistryProvider: Provider = {
    provide: TOOLKIT_INTERNAL_COMMAND_REGISTRY,
    useFactory: (
        logger: ILogger,
        alertHandler: AlertScenarioCommandHandler,
        resetHandler: ResetTenantCommandHandler,
        hardResetHandler: ResetTenantHardCommandHandler,
    ): CommandRegistry => {
        const registry = new CommandRegistry(logger);
        registry.register(alertHandler);
        registry.register(resetHandler);
        registry.register(hardResetHandler);
        return registry;
    },
    inject: [
        TOOLKIT_INTERNAL_LOGGER,
        AlertScenarioCommandHandler,
        ResetTenantCommandHandler,
        ResetTenantHardCommandHandler,
    ],
};

export const TOOLKIT_INTERNAL_PROVIDERS: Provider[] = [
    toolkitConfigProvider,
    toolkitLoggerProvider,
    toolkitUiPrinterProvider,
    toolkitGoogleAdsSeederServiceProvider,
    toolkitAlertEngineProvider,
    toolkitAlertScenarioServiceProvider,
    toolkitTenantResetServiceProvider,
    toolkitAlertScenarioCommandHandlerProvider,
    toolkitResetTenantCommandHandlerProvider,
    toolkitResetTenantHardCommandHandlerProvider,
    toolkitCommandRegistryProvider,
];
