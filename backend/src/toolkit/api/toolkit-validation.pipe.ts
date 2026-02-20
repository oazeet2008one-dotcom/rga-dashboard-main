import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export const TOOLKIT_VALIDATION_PIPE_OPTIONS: ValidationPipeOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
};

export function createToolkitValidationPipe(): ValidationPipe {
    return new ValidationPipe(TOOLKIT_VALIDATION_PIPE_OPTIONS);
}

