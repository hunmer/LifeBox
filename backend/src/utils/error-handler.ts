import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: AppError | ZodError | any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  } 
  // Handle custom app errors
  else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle other known errors
  else if (error.message) {
    message = error.message;
  }

  // Log error details (but not in test environment unless it's a 500 error)
  if (process.env.NODE_ENV !== 'test' || statusCode >= 500) {
    console.error('Error:', {
      message,
      statusCode,
      stack: error.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      ...(details && { validationErrors: details }),
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

/**
 * Create an operational error
 */
export function createError(message: string, statusCode: number = 500): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}