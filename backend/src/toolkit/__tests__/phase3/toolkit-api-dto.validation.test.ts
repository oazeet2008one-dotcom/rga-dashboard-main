import 'reflect-metadata';
import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
    AlertScenarioDto,
    GetAlertHistoryQueryDto,
    GetAlertsQueryDto,
    GetMetricsQueryDto,
    ResetTenantDto,
    ResetTenantHardDto,
} from '../../api/dto';

async function validateDto<T extends object>(dtoClass: new () => T, payload: unknown) {
    const instance = plainToInstance(dtoClass, payload);
    const errors = await validate(instance as object);
    return { instance, errors };
}

describe('Toolkit API DTO validation', () => {
    test('AlertScenarioDto should transform and validate boolean/number fields', async () => {
        const { instance, errors } = await validateDto(AlertScenarioDto, {
            tenantId: 'tenant-1',
            seedBaseline: 'false',
            injectAnomaly: 'true',
            days: '14',
            dryRun: 'true',
            confirmWrite: 'false',
        });

        assert.strictEqual(errors.length, 0);
        assert.strictEqual(instance.seedBaseline, false);
        assert.strictEqual(instance.injectAnomaly, true);
        assert.strictEqual(instance.days, 14);
    });

    test('AlertScenarioDto should reject out-of-range days', async () => {
        const { errors } = await validateDto(AlertScenarioDto, {
            tenantId: 'tenant-1',
            days: 366,
        });

        assert.ok(errors.some((error) => error.property === 'days'));
    });

    test('AlertScenarioDto should require confirmWrite=true when dryRun=false', async () => {
        const { errors } = await validateDto(AlertScenarioDto, {
            tenantId: 'tenant-1',
            dryRun: false,
            confirmWrite: false,
        });

        assert.ok(errors.some((error) => error.property === 'confirmWrite'));
    });

    test('ResetTenantDto should require confirmWrite=true when dryRun=false', async () => {
        const { errors } = await validateDto(ResetTenantDto, {
            tenantId: 'tenant-1',
            dryRun: false,
            confirmWrite: false,
        });

        assert.ok(errors.some((error) => error.property === 'confirmWrite'));
    });

    test('ResetTenantHardDto should require HARD_RESET ack and valid ISO datetime', async () => {
        const { errors } = await validateDto(ResetTenantHardDto, {
            tenantId: 'tenant-1',
            confirmationToken: 'RTH.token.secret',
            confirmedAt: 'not-a-date',
            destructiveAck: 'WRONG_ACK',
            dryRun: false,
            confirmWrite: false,
        });

        assert.ok(errors.some((error) => error.property === 'confirmedAt'));
        assert.ok(errors.some((error) => error.property === 'destructiveAck'));
        assert.ok(errors.some((error) => error.property === 'confirmWrite'));
    });

    test('GetMetricsQueryDto should enforce tenantId and limit bounds', async () => {
        const { errors } = await validateDto(GetMetricsQueryDto, {
            tenantId: '',
            limit: 6000,
        });

        assert.ok(errors.some((error) => error.property === 'tenantId'));
        assert.ok(errors.some((error) => error.property === 'limit'));
    });

    test('GetMetricsQueryDto should reject endDate earlier than startDate', async () => {
        const { errors } = await validateDto(GetMetricsQueryDto, {
            tenantId: 'tenant-1',
            startDate: '2025-02-10',
            endDate: '2025-02-01',
        });

        assert.ok(errors.some((error) => error.property === 'endDate'));
    });

    test('GetAlertHistoryQueryDto should apply default limit when omitted', async () => {
        const { instance, errors } = await validateDto(GetAlertHistoryQueryDto, {
            tenantId: 'tenant-1',
        });

        assert.strictEqual(errors.length, 0);
        assert.strictEqual(instance.limit, 100);
    });

    test('GetAlertsQueryDto should reject unsupported status value', async () => {
        const { errors } = await validateDto(GetAlertsQueryDto, {
            tenantId: 'tenant-1',
            status: 'INVALID_STATUS',
        });

        assert.ok(errors.some((error) => error.property === 'status'));
    });
});
