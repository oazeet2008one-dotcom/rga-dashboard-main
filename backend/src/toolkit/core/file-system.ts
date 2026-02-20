/**
 * =============================================================================
 * File System Adapter
 * =============================================================================
 */

import { writeFile, readFile, mkdir, rename, rm } from 'fs/promises';
import { existsSync } from 'fs';

export interface IFileSystem {
    exists(path: string): boolean;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    mkdir(path: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    rm(path: string): Promise<void>;
}

export class NodeFileSystem implements IFileSystem {
    exists(path: string): boolean {
        return existsSync(path);
    }

    async readFile(path: string): Promise<string> {
        return readFile(path, 'utf-8');
    }

    async writeFile(path: string, content: string): Promise<void> {
        return writeFile(path, content, 'utf-8');
    }

    async mkdir(path: string): Promise<void> {
        await mkdir(path, { recursive: true });
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        await rename(oldPath, newPath);
    }

    async rm(path: string): Promise<void> {
        await rm(path, { force: true });
    }
}
