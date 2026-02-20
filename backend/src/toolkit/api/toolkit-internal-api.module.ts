import { Module } from '@nestjs/common';
import { PrismaModule } from '../../modules/prisma/prisma.module';
import { ToolkitController } from './toolkit.controller';
import { ToolkitCommandExecutorService } from './toolkit-command-executor.service';
import { ToolkitInternalGuard } from './toolkit-internal.guard';
import { TOOLKIT_INTERNAL_PROVIDERS } from './toolkit-internal.providers';
import { ToolkitQueryService } from './toolkit-query.service';

@Module({
    imports: [PrismaModule],
    controllers: [ToolkitController],
    providers: [
        ToolkitInternalGuard,
        ToolkitQueryService,
        ToolkitCommandExecutorService,
        ...TOOLKIT_INTERNAL_PROVIDERS,
    ],
})
export class ToolkitInternalApiModule {}
