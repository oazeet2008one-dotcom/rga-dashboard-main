import { TransformFnParams } from 'class-transformer';

export function toOptionalBoolean({ value }: TransformFnParams): unknown {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') {
            return true;
        }
        if (normalized === 'false') {
            return false;
        }
    }

    return value;
}
