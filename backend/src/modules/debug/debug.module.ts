import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { DebugService } from './debug.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationController } from './verification.controller';
import { VerificationSeeder } from '../mock-data/generators/verification-seeder';
import { AlertModule } from '../alerts/alert.module';

@Module({
    imports: [PrismaModule, AlertModule],
    controllers: [DebugController, VerificationController],
    providers: [DebugService, VerificationSeeder],
})
export class DebugModule { }
