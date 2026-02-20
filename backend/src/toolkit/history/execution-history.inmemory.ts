/**
 * =============================================================================
 * In-Memory Execution History Repository
 * =============================================================================
 *
 * In-memory implementation of ExecutionHistoryRepository.
 *
 * Design Principles:
 * - Tenant-scoped
 * - Append-only
 * - Fast queries
 * - No persistence guarantees
 *
 * Use Cases:
 * - Developer Toolkit
 * - Testing
 * - Simulation
 *
 * Limitations:
 * - Data lost on process restart
 * - Memory-constrained
 * - Not for production
 * =============================================================================
 */

import { injectable } from 'tsyringe';
import {
    ExecutionHistoryRecord,
    HistoryQueryOptions,
    HistoryQueryResult,
    ExecutionSummary,
    createQueryOptions,
    calculateExecutionSummary,
} from './execution-history.model';
import {
    ExecutionHistoryRepository,
    HistoryPersistenceError,
    HistoryQueryError,
} from './execution-history.repository';

// =============================================================================
// Configuration
// =============================================================================

export interface InMemoryRepositoryConfig {
    /**
     * Maximum records per tenant
     * When exceeded, oldest records are evicted
     * Default: 10,000
     */
    readonly maxRecordsPerTenant: number;

    /**
     * Maximum age of records in milliseconds
     * Records older than this are evicted
     * Default: 7 days
     */
    readonly maxRecordAgeMs: number;
}

const DEFAULT_CONFIG: InMemoryRepositoryConfig = {
    maxRecordsPerTenant: 10000,
    maxRecordAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// =============================================================================
// In-Memory Implementation
// =============================================================================

@injectable()
export class InMemoryExecutionHistoryRepository
    implements ExecutionHistoryRepository
{
    /**
     * Storage: Map<tenantId, ExecutionHistoryRecord[]>
     * Records are stored in chronological order (oldest first)
     */
    private storage: Map<string, ExecutionHistoryRecord[]> = new Map();

    constructor(private readonly config: InMemoryRepositoryConfig = DEFAULT_CONFIG) {}

    /**
     * Record a completed execution.
     *
     * Append-only operation. May trigger eviction if limits exceeded.
     */
    async record(record: ExecutionHistoryRecord, now?: Date): Promise<void> {
        try {
            const tenantRecords = this.getTenantRecords(record.tenantId);

            // Append record (maintain chronological order)
            tenantRecords.push(record);

            // Evict old records if necessary
            this.evictIfNecessary(record.tenantId, now);
        } catch (error) {
            // Wrap error but don't fail the caller
            // History is best-effort
            throw new HistoryPersistenceError(
                `Failed to record execution history: ${(error as Error).message}`,
                record.executionId,
                error as Error
            );
        }
    }

    /**
     * Find recent executions by tenant.
     */
    async findRecentByTenant(
        tenantId: string,
        options?: HistoryQueryOptions
    ): Promise<HistoryQueryResult> {
        const opts = createQueryOptions(options);

        // Validate options
        if (opts.limit && opts.limit > 1000) {
            throw new HistoryQueryError('Limit cannot exceed 1000', { limit: opts.limit });
        }

        let records = this.getTenantRecords(tenantId);

        // Apply filters
        records = this.applyFilters(records, opts);

        // Apply sorting
        records = this.applySorting(records, opts);

        // Calculate total before pagination
        const totalCount = records.length;

        // Apply pagination
        const offset = opts.offset ?? 0;
        const limit = opts.limit ?? 100;
        const paginatedRecords = records.slice(offset, offset + limit);

        return {
            records: paginatedRecords,
            totalCount,
            hasMore: totalCount > offset + limit,
        };
    }

    /**
     * Count executions within a time window.
     */
    async countExecutionsInWindow(
        tenantId: string,
        windowMs: number,
        now?: Date
    ): Promise<number> {
        const records = this.getTenantRecords(tenantId);
        const currentTime = now ?? new Date();
        const cutoff = new Date(currentTime.getTime() - windowMs);

        return records.filter((r) => r.finishedAt >= cutoff).length;
    }

    /**
     * Get the most recent execution for a tenant.
     */
    async getMostRecent(
        tenantId: string
    ): Promise<ExecutionHistoryRecord | null> {
        const records = this.getTenantRecords(tenantId);

        if (records.length === 0) {
            return null;
        }

        // Records are in chronological order, so last is most recent
        return records[records.length - 1] ?? null;
    }

    /**
     * Get execution summary for a time window.
     */
    async getExecutionSummary(
        tenantId: string,
        windowMs: number,
        now?: Date
    ): Promise<ExecutionSummary> {
        const records = this.getTenantRecords(tenantId);
        const currentTime = now ?? new Date();
        const cutoff = new Date(currentTime.getTime() - windowMs);

        const windowRecords = records.filter((r) => r.finishedAt >= cutoff);

        return calculateExecutionSummary(windowRecords, cutoff, currentTime);
    }

    // =========================================================================
    // Management API (for testing/debugging)
    // =========================================================================

    /**
     * Get total record count across all tenants.
     */
    getTotalRecordCount(): number {
        let count = 0;
        for (const records of this.storage.values()) {
            count += records.length;
        }
        return count;
    }

    /**
     * Get record count for a specific tenant.
     */
    getTenantRecordCount(tenantId: string): number {
        return this.getTenantRecords(tenantId).length;
    }

    /**
     * Clear all history (for testing).
     */
    clearAll(): void {
        this.storage.clear();
    }

    /**
     * Clear history for a specific tenant (for testing).
     */
    clearTenant(tenantId: string): void {
        this.storage.delete(tenantId);
    }

    // =========================================================================
    // Private Implementation
    // =========================================================================

    /**
     * Get or create tenant records array.
     */
    private getTenantRecords(tenantId: string): ExecutionHistoryRecord[] {
        if (!this.storage.has(tenantId)) {
            this.storage.set(tenantId, []);
        }
        return this.storage.get(tenantId)!;
    }

    /**
     * Apply query filters to records.
     */
    private applyFilters(
        records: ExecutionHistoryRecord[],
        options: HistoryQueryOptions
    ): ExecutionHistoryRecord[] {
        return records.filter((record) => {
            // Time range filter
            if (options.startTime && record.finishedAt < options.startTime) {
                return false;
            }
            if (options.endTime && record.finishedAt > options.endTime) {
                return false;
            }

            // Status filter
            if (options.status && record.status !== options.status) {
                return false;
            }

            // Dry run filter
            if (options.dryRun !== undefined && record.dryRun !== options.dryRun) {
                return false;
            }

            return true;
        });
    }

    /**
     * Apply sorting to records.
     */
    private applySorting(
        records: ExecutionHistoryRecord[],
        options: HistoryQueryOptions
    ): ExecutionHistoryRecord[] {
        const sorted = [...records];
        const order = options.order ?? 'desc';

        sorted.sort((a, b) => {
            const comparison =
                a.finishedAt.getTime() - b.finishedAt.getTime();
            return order === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }

    /**
     * Evict old records if limits exceeded.
     */
    private evictIfNecessary(tenantId: string, now?: Date): void {
        const records = this.getTenantRecords(tenantId);
        const currentTime = now ?? new Date();
        const nowMs = currentTime.getTime();

        // Evict by age
        const maxAge = this.config.maxRecordAgeMs;
        const ageCutoff = new Date(nowMs - maxAge);

        let evictionIndex = 0;
        while (
            evictionIndex < records.length &&
            records[evictionIndex]!.finishedAt < ageCutoff
        ) {
            evictionIndex++;
        }

        if (evictionIndex > 0) {
            records.splice(0, evictionIndex);
        }

        // Evict by count
        const maxCount = this.config.maxRecordsPerTenant;
        if (records.length > maxCount) {
            const toRemove = records.length - maxCount;
            records.splice(0, toRemove);
        }
    }
}
