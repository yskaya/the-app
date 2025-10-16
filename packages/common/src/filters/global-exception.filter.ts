import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // Log error for debugging
    this.logger.error(
      `${request.method} ${request.url} - ${errorResponse.statusCode} - ${errorResponse.message}`,
      exception instanceof Error ? exception.stack : 'Unknown error'
    );

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      return {
        error: 'HTTP Exception',
        message: typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : (exceptionResponse as any).message || exception.message,
        statusCode: status,
        timestamp,
        path,
      };
    }

    // Handle Prisma errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception, timestamp, path);
    }

    // Handle Axios errors (service communication)
    if (this.isAxiosError(exception)) {
      return this.handleAxiosError(exception, timestamp, path);
    }

    // Handle JWT errors
    if (this.isJWTError(exception)) {
      return this.handleJWTError(exception, timestamp, path);
    }

    // Default server error
    return {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
    };
  }

  private isPrismaError(exception: any): boolean {
    return exception?.code && exception?.meta;
  }

  private handlePrismaError(exception: any, timestamp: string, path: string): ErrorResponse {
    const { code, meta } = exception;

    switch (code) {
      case 'P2002':
        return {
          error: 'Conflict',
          message: `Unique constraint failed on field: ${meta?.target?.join(', ')}`,
          statusCode: HttpStatus.CONFLICT,
          timestamp,
          path,
        };
      case 'P2025':
        return {
          error: 'Not Found',
          message: 'Record not found',
          statusCode: HttpStatus.NOT_FOUND,
          timestamp,
          path,
        };
      case 'P2003':
        return {
          error: 'Bad Request',
          message: 'Foreign key constraint failed',
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          path,
        };
      default:
        return {
          error: 'Database Error',
          message: 'Database operation failed',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp,
          path,
        };
    }
  }

  private isAxiosError(exception: any): boolean {
    return exception?.isAxiosError === true;
  }

  private handleAxiosError(exception: any, timestamp: string, path: string): ErrorResponse {
    const status = exception.response?.status;
    const message = exception.response?.data?.message || exception.message;

    if (status >= 400 && status < 500) {
      return {
        error: 'Service Error',
        message: `External service error: ${message}`,
        statusCode: HttpStatus.BAD_GATEWAY,
        timestamp,
        path,
      };
    }

    return {
      error: 'Service Unavailable',
      message: 'External service is temporarily unavailable',
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      timestamp,
      path,
    };
  }

  private isJWTError(exception: any): boolean {
    return exception?.name === 'JsonWebTokenError' || 
           exception?.name === 'TokenExpiredError' ||
           exception?.name === 'NotBeforeError';
  }

  private handleJWTError(exception: any, timestamp: string, path: string): ErrorResponse {
    switch (exception.name) {
      case 'TokenExpiredError':
        return {
          error: 'Token Expired',
          message: 'Authentication token has expired',
          statusCode: HttpStatus.UNAUTHORIZED,
          timestamp,
          path,
        };
      case 'JsonWebTokenError':
        return {
          error: 'Invalid Token',
          message: 'Authentication token is invalid',
          statusCode: HttpStatus.UNAUTHORIZED,
          timestamp,
          path,
        };
      default:
        return {
          error: 'Authentication Error',
          message: 'Token validation failed',
          statusCode: HttpStatus.UNAUTHORIZED,
          timestamp,
          path,
        };
    }
  }
}
