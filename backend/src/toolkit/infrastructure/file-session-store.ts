/**
 * =============================================================================
 * File-Based Session Store
 * =============================================================================
 * 
 * Simple JSON file persistence for development.
 * Production should use a transactional store (PostgreSQL/Redis).
 * 
 * Design Principles:
 * - Interface Segregation: Implements only ISessionStore
 * - Async-First: All operations return promises
 * - Atomic Writes: Write to temp file then rename
 * =============================================================================
 */

import { injectable } from 'tsyringe';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { ISessionStore, TenantId, CommandHistoryEntry, createTenantId } from '../core/contracts';
import { IFileSystem, NodeFileSystem } from '../core/file-system';

interface StoreData {
    version: number;
    lastTenantId: string | null;
    cache: Record<string, { value: unknown; expiresAt: string }>;
    history: CommandHistoryEntry[];
}

@injectable()
export class FileSessionStore implements ISessionStore {
    private readonly filePath: string;
    private readonly fs: IFileSystem;
    private data: StoreData;
    private initialized = false;

    constructor(fs?: IFileSystem) {
        this.fs = fs || new NodeFileSystem();

        // Store in user's home directory under .rga-toolkit
        const storeDir = join(homedir(), '.rga-toolkit');
        this.filePath = join(storeDir, 'session.json');

        // Initialize with defaults
        this.data = {
            version: 1,
            lastTenantId: null,
            cache: {},
            history: [],
        };
    }

    private async ensureInitialized(): Promise<void> {
        if (this.initialized) return;

        try {
            // Ensure directory exists
            const dir = dirname(this.filePath);
            if (!this.fs.exists(dir)) {
                await this.fs.mkdir(dir);
            }

            // Try to load existing data
            if (this.fs.exists(this.filePath)) {
                const content = await this.fs.readFile(this.filePath);
                this.data = JSON.parse(content);
            }
        } catch (error) {
            // If read fails, start with empty data
            console.warn('Failed to load session store, starting fresh:', error);
        }

        this.initialized = true;
    }

    private async save(): Promise<void> {
        const tempPath = `${this.filePath}.tmp`;
        await this.fs.writeFile(tempPath, JSON.stringify(this.data, null, 2));
        try {
            await this.fs.rename(tempPath, this.filePath);
        } catch (error) {
            // Windows may reject overwrite on rename; remove destination then retry once.
            await this.fs.rm(this.filePath);
            await this.fs.rename(tempPath, this.filePath);
        } finally {
            if (this.fs.exists(tempPath)) {
                await this.fs.rm(tempPath);
            }
        }
    }

    async getLastTenantId(): Promise<TenantId | null> {
        await this.ensureInitialized();
        return this.data.lastTenantId ? createTenantId(this.data.lastTenantId) : null;
    }

    async setLastTenantId(tenantId: TenantId): Promise<void> {
        await this.ensureInitialized();
        this.data.lastTenantId = tenantId;
        await this.save();
    }

    async getCache<T>(key: string): Promise<T | null> {
        await this.ensureInitialized();

        const entry = this.data.cache[key];
        if (!entry) return null;

        // Check expiration
        if (new Date(entry.expiresAt) < new Date()) {
            delete this.data.cache[key];
            await this.save();
            return null;
        }

        return entry.value as T;
    }

    async setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        await this.ensureInitialized();

        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
        this.data.cache[key] = { value, expiresAt };
        await this.save();
    }

    async addToHistory(entry: CommandHistoryEntry): Promise<void> {
        await this.ensureInitialized();

        this.data.history.unshift(entry);

        // Keep only last 100 entries
        if (this.data.history.length > 100) {
            this.data.history = this.data.history.slice(0, 100);
        }

        await this.save();
    }

    async getHistory(limit: number): Promise<ReadonlyArray<CommandHistoryEntry>> {
        await this.ensureInitialized();
        return this.data.history.slice(0, limit);
    }
}
