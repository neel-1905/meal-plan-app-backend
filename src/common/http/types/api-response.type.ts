export interface ApiSuccessResponse<T, M = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: M;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  details?: unknown;
}

export type ApiResponse<T, M = unknown> =
  ApiSuccessResponse<T, M> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
