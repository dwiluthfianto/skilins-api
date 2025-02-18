export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
  path?: string;
  timestamp?: string;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    last_page?: number;
  };
}
