import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { DebugService } from './debug.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertModule } from '../alerts/alert.module';

@Module({
    imports: [PrismaModule, AlertModule],
    controllers: [DebugController],
    providers: [DebugService],
})
export class DebugModule { }
