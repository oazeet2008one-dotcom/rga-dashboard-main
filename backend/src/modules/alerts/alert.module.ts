import { Module, forwardRef } from '@nestjs/common';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';
import { AlertSchedulerService } from './alert-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [
        PrismaModule,
        // Use forwardRef to handle circular dependency
        forwardRef(() => NotificationModule),
    ],
    controllers: [AlertController],
    providers: [AlertService, AlertSchedulerService],
    exports: [AlertService, AlertSchedulerService],
})
export class AlertModule { }
