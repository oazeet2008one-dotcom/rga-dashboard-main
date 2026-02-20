import * as path from 'path';

export type OutputPathKind = 'manifest' | 'report';

export class OutputPathPolicyError extends Error {
    readonly code = 'OUTPUT_PATH_BLOCKED';
    readonly exitCode = 78;

    constructor(message: string) {
        super(message);
        this.name = 'OutputPathPolicyError';
    }
}

function isSubPath(root: string, candidate: string): boolean {
    const rel = path.relative(root, candidate);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function parseRootsFromEnv(envVar: string | undefined): string[] {
    if (!envVar) return [];
    return envVar
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => path.resolve(v));
}

function unique(values: string[]): string[] {
    return Array.from(new Set(values));
}

export function getDefaultOutputRoot(kind: OutputPathKind): string {
    if (kind === 'manifest') {
        return path.resolve(process.cwd(), 'toolkit-manifests');
    }
    return path.resolve(process.cwd(), 'artifacts', 'reports');
}

export function getAllowedOutputRoots(kind: OutputPathKind): string[] {
    const defaultRoot = getDefaultOutputRoot(kind);
    const envVar = kind === 'manifest'
        ? process.env.TOOLKIT_ALLOWED_MANIFEST_ROOTS
        : process.env.TOOLKIT_ALLOWED_REPORT_ROOTS;

    const extraRoots = parseRootsFromEnv(envVar);
    return unique([defaultRoot, ...extraRoots]);
}

export function resolveOutputDir(kind: OutputPathKind, requestedDir?: string | null): string {
    const resolved = requestedDir
        ? path.resolve(requestedDir)
        : getDefaultOutputRoot(kind);

    const allowedRoots = getAllowedOutputRoots(kind);
    const allowed = allowedRoots.some(root => isSubPath(root, resolved));

    if (!allowed) {
        const roots = allowedRoots.join(', ');
        throw new OutputPathPolicyError(
            `Output path "${resolved}" is outside allowlisted ${kind} roots: [${roots}]`,
        );
    }

    return resolved;
}
