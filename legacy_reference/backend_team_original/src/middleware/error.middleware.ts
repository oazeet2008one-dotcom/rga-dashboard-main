import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// FLOW START: Error Middleware (EN)
// จุดเริ่มต้น: Middleware จัดการ Error (TH)

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  logger.error('Error:', {
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  const errorResponse = {
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
  };

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = <T = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T> | T,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// FLOW END: Error Middleware (EN)
// จุดสิ้นสุด: Middleware จัดการ Error (TH)
