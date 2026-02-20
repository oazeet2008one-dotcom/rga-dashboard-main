/**
 * =============================================================================
 * In-Memory Schedule Provider
 * =============================================================================
 *
 * In-memory implementation of IScheduleProvider.
 *
 * Design Principles:
 * - Fast, no I/O overhead
 * - Useful for tests and programmatic schedule creation
 * - Tenant-scoped
 * - No persistence
 *
 * Use cases:
 * - Unit tests with programmatic schedules
 * - Dynamic schedule creation in tests
 * - Simulation scenarios
 * =============================================================================
 */

import { injectable } from 'tsyringe';
import {
    ScheduledExecution,
    IScheduleProvider,
    validateScheduledExecution,
} from './scheduled-execution.model';

// =============================================================================
// In-Memory Schedule Provider
// =============================================================================

@injectable()
export class InMemoryScheduleProvider implements IScheduleProvider {
    /**
     * Storage: Map<tenantId, Map<scheduleId, ScheduledExecution>>
     */
    private storage: Map<string, Map<string, ScheduledExecution>> = new Map();

    /**
     * Get all enabled schedules for a tenant.
     */
    async getSchedulesForTenant(tenantId: string): Promise<ScheduledExecution[]> {
        const tenantSchedules = this.getTenantStorage(tenantId);
        return Array.from(tenantSchedules.values()).filter((s) => s.enabled);
    }

    /**
     * Add a schedule for a tenant.
     *
     * @param tenantId The tenant to add the schedule for
     * @param execution The scheduled execution to add
     * @returns Validation result
     */
    addSchedule(
        tenantId: string,
        execution: ScheduledExecution
    ): { success: boolean; errors?: string[] } {
        // Validate
        const validation = validateScheduledExecution(execution);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }

        // Verify tenant match
        if (execution.tenantId !== tenantId) {
            return {
                success: false,
                errors: [
                    `Tenant mismatch: schedule.tenantId (${execution.tenantId}) does not match provided tenantId (${tenantId})`,
                ],
            };
        }

        const tenantStorage = this.getTenantStorage(tenantId);
        tenantStorage.set(execution.id, execution);

        return { success: true };
    }

    /**
     * Remove a schedule by ID.
     *
     * @param tenantId The tenant that owns the schedule
     * @param scheduleId The schedule ID to remove
     * @returns True if removed, false if not found
     */
    removeSchedule(tenantId: string, scheduleId: string): boolean {
        const tenantStorage = this.getTenantStorage(tenantId);
        return tenantStorage.delete(scheduleId);
    }

    /**
     * Get a specific schedule by ID.
     *
     * @param tenantId The tenant that owns the schedule
     * @param scheduleId The schedule ID to get
     * @returns The schedule or null if not found
     */
    getSchedule(
        tenantId: string,
        scheduleId: string
    ): ScheduledExecution | null {
        const tenantStorage = this.getTenantStorage(tenantId);
        return tenantStorage.get(scheduleId) ?? null;
    }

    /**
     * Get all schedules for a tenant (including disabled).
     *
     * @param tenantId The tenant to get schedules for
     * @returns Array of all scheduled executions
     */
    getAllSchedules(tenantId: string): ScheduledExecution[] {
        const tenantStorage = this.getTenantStorage(tenantId);
        return Array.from(tenantStorage.values());
    }

    /**
     * Clear all schedules for a tenant.
     *
     * @param tenantId The tenant to clear
     */
    clearTenant(tenantId: string): void {
        this.storage.delete(tenantId);
    }

    /**
     * Clear all schedules (for all tenants).
     */
    clearAll(): void {
        this.storage.clear();
    }

    /**
     * Check if a schedule exists.
     *
     * @param tenantId The tenant that owns the schedule
     * @param scheduleId The schedule ID to check
     * @returns True if exists
     */
    hasSchedule(tenantId: string, scheduleId: string): boolean {
        const tenantStorage = this.storage.get(tenantId);
        if (!tenantStorage) {
            return false;
        }
        return tenantStorage.has(scheduleId);
    }

    /**
     * Get count of schedules for a tenant.
     *
     * @param tenantId The tenant to count schedules for
     * @returns Number of schedules
     */
    getScheduleCount(tenantId: string): number {
        const tenantStorage = this.storage.get(tenantId);
        return tenantStorage?.size ?? 0;
    }

    // =========================================================================
    // Private Implementation
    // =========================================================================

    private getTenantStorage(tenantId: string): Map<string, ScheduledExecution> {
        if (!this.storage.has(tenantId)) {
            this.storage.set(tenantId, new Map());
        }
        return this.storage.get(tenantId)!;
    }
}
