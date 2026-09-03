import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';
import { ApiSuccessResponse } from '../types/api-response.type.js';

interface ControllerResponse<T> {
  data: T;
  meta?: unknown;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T | ControllerResponse<T>,
  ApiSuccessResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T | ControllerResponse<T>>,
  ): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest();

    // Do not modify Better Auth responses.
    if (!request.url.startsWith('/api/v1')) {
      return next.handle() as Observable<ApiSuccessResponse<T>>;
    }

    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ??
      'Request successful';

    return next.handle().pipe(
      map((result) => {
        if (result !== null && typeof result === 'object' && 'data' in result) {
          const response = result as ControllerResponse<T>;

          return {
            success: true as const,
            message,
            data: response.data,
            ...(response.meta !== undefined && {
              meta: response.meta,
            }),
          };
        }

        return {
          success: true as const,
          message,
          data: result as T,
        };
      }),
    );
  }
}
