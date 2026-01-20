import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Custom Business Exception for application-specific errors
 */
export class BusinessException extends Error {
    constructor(
        public readonly code: string,
        public readonly message: string,
        public readonly statusCode: number = 400,
        public readonly meta?: Record<string, any>,
    ) {
        super(message);
        this.name = 'BusinessException';
    }
}

/**
 * Standardized API Error Response Interface
 */
export interface ApiErrorResponse {
    success: false;
    data: null;
    statusCode: number;
    error: string;
    message: string;
    meta?: Record<string, any>;
    timestamp: string;
    path: string;
}

/**
 * Global Exception Filter that handles all exceptions
 * and returns a consistent error response format
 * 
 * Response Schema:
 * {
 *   success: false,
 *   data: null,
 *   statusCode: 401,
 *   error: 'ACCOUNT_LOCKED',
 *   message: 'Account is locked. Try again in 30 minutes.',
 *   meta: { lockoutMinutes: 30 },
 *   timestamp: '2026-01-20T...',
 *   path: '/api/v1/auth/login'
 * }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred';
        let meta: Record<string, any> | undefined = undefined;

        // Handle BusinessException (custom application errors)
        if (exception instanceof BusinessException) {
            status = exception.statusCode;
            errorCode = exception.code;
            message = exception.message;
            meta = exception.meta;
        }
        // Handle HttpException (including all NestJS built-in exceptions)
        else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse as any;

                // Extract message (handle class-validator array format)
                message = Array.isArray(res.message)
                    ? res.message.join(', ')
                    : res.message || exception.message;

                // Extract error code (use provided or infer from status)
                errorCode = res.error || this.inferErrorCode(status);

                // Extract meta for contextual data (e.g., lockoutMinutes, remainingAttempts)
                meta = res.meta;
            } else {
                message = exceptionResponse as string;
            }
        }
        // Handle unknown errors (non-HTTP exceptions)
        else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(
                `Unhandled exception: ${exception.message}`,
                exception.stack,
            );
        }

        // Log error details
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${errorCode} - ${message}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        // Build response object
        const errorResponse: ApiErrorResponse = {
            success: false,
            data: null,
            statusCode: status,
            error: errorCode,
            message,
            ...(meta && { meta }),
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(status).json(errorResponse);
    }

    /**
     * Infer error code from HTTP status when not explicitly provided
     */
    private inferErrorCode(status: number): string {
        switch (status) {
            case HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case HttpStatus.CONFLICT:
                return 'CONFLICT';
            case HttpStatus.UNPROCESSABLE_ENTITY:
                return 'VALIDATION_ERROR';
            case HttpStatus.TOO_MANY_REQUESTS:
                return 'TOO_MANY_REQUESTS';
            default:
                return 'INTERNAL_ERROR';
        }
    }
}
