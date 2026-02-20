import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationService } from './verification.service';
import { VerificationRepository } from './verification.repository';
import { ScenarioLoader } from '../../toolkit/scenarios/scenario-loader';
import { AlertRuleEvaluator } from './rules/alert-rule.evaluator';

@Module({
    imports: [PrismaModule],
    providers: [
        VerificationService,
        VerificationRepository,
        ScenarioLoader,
        AlertRuleEvaluator,
    ],
    exports: [VerificationService],
})
export class VerificationModule { }
