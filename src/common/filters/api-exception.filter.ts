import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const path = request.url;

    let errorResponse: any;

    if (exception instanceof ApiException) {
      errorResponse = ErrorResponse.create(
        exception.message,
        exception.code || status,
        exception.errors,
        path,
      );
    } else {
      errorResponse = ErrorResponse.create(
        exception.message,
        status,
        undefined,
        path,
      );
    }

    response.status(status).json(errorResponse);
  }
}
