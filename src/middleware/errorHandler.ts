import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '@/utils/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // ── Zod validation errors → clean 400 with the specific reason ──
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path.join('.');

    // Friendlier message for fields that exist but aren't editable here
    let message: string;
    if (issue?.code === 'unrecognized_keys') {
      const keys = (issue as { keys?: string[] }).keys?.join(', ') ?? 'unknown';
      message = `These fields cannot be set on this request: ${keys}.`;
    } else {
      message = field
        ? `Validation error on "${field}": ${issue?.message}`
        : `Validation error: ${issue?.message}`;
    }

    res.status(400).json({
      success: false,
      message,
      data: null,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
    return;
  }

  logger.error('Unexpected error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
    data: null,
  });
};