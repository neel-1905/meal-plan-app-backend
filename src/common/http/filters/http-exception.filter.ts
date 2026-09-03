import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';

import { ApiErrorResponse } from '../types/api-response.type.js';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    /*
     * Better Auth lives outside /api/v1.
     * Let Nest handle those errors normally.
     */
    if (!request.url.startsWith('/api/v1')) {
      super.catch(exception, host);
      return;
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const exceptionBody = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        if (Array.isArray(exceptionBody.message)) {
          message = 'Validation failed';
          details = exceptionBody.message;
        } else if (exceptionBody.message) {
          message = exceptionBody.message;
        }

        if (exceptionBody.error) {
          error = exceptionBody.error;
        }
      }
    } else {
      // Log unexpected errors but don't expose internal details.
      this.logger.error(exception);
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      message,
      error,
      statusCode,
      ...(details !== undefined && {
        details,
      }),
    };

    response.status(statusCode).json(errorResponse);
  }
}
