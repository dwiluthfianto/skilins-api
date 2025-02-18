import { ApiResponse } from '@interfaces/api-response.interface';

export class SuccessResponse<T> {
  static create<T>(data: T, message = 'Success', code = 200): ApiResponse<T> {
    return {
      success: true,
      message,
      code,
      data,
    };
  }

  static paginate<T>(
    data: T,
    pagination: {
      page: number;
      limit: number;
      total: number;
      last_page?: number;
    },
    message = 'Success',
    code = 200,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      code,
      data,
      pagination: {
        ...pagination,
        last_page:
          pagination.last_page ||
          Math.ceil(pagination.total / pagination.limit),
      },
    };
  }
}

export class ErrorResponse {
  static create(
    message: string,
    code = 400,
    errors?: any[],
    path?: string,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      code,
      path,
      timestamp: new Date().toISOString(),
      ...(errors && { errors }),
    };
  }
}
