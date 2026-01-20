/**
 * API Response Types
 * Shared API response interfaces
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}
