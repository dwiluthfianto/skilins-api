import { HttpException } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    message: string,
    status: number,
    public readonly code?: number,
    public readonly errors?: any[],
  ) {
    super(message, status);
  }
}
