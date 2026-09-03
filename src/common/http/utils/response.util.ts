import { ResponseData } from '../types/api-response.type.js';

export function responseData<T, M = unknown>(
  data: T,
  meta?: M,
): ResponseData<T, M> {
  return {
    data,
    ...(meta !== undefined && { meta }),
  };
}
