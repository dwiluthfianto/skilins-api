import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';
import { Logger } from 'winston';
import { Prisma } from '@prisma/client';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(@Inject('winston') private readonly logger: Logger) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    const { httpStatus, code, message, errors } =
      this.handleException(exception);

    const errorResponse = ErrorResponse.create(message, code, errors, path);

    this.logError(exception, errorResponse);
    response.status(httpStatus).json(errorResponse);
  }

  private handleException(exception: unknown): {
    httpStatus: number;
    code: number;
    message: string;
    errors: any[];
  } {
    if (exception instanceof ApiException) {
      return {
        httpStatus: exception.getStatus(),
        code: exception.code || exception.getStatus(),
        message: exception.message,
        errors: exception.errors || [],
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      return {
        httpStatus: status,
        code: status,
        message: exception.message,
        errors:
          typeof response === 'object'
            ? (response as any).message || []
            : [response],
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaKnownRequestError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        httpStatus: HttpStatus.BAD_REQUEST,
        code: HttpStatus.BAD_REQUEST,
        message: 'Validation error',
        errors: [this.getPrismaValidationDetails(exception)],
      };
    }

    if (exception instanceof Error) {
      return {
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        errors: [exception.message],
      };
    }

    return {
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unknown error occurred',
      errors: [],
    };
  }

  private handlePrismaKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
  ) {
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    const errors = [exception.meta];

    switch (exception.code) {
      case 'P2025':
        httpStatus = HttpStatus.NOT_FOUND;
        message = exception.meta?.cause?.toString() || 'Record not found';
        break;
      case 'P2002':
        httpStatus = HttpStatus.CONFLICT;
        message = 'Unique constraint violation';
        break;
      case 'P2003':
        httpStatus = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint failed';
        break;
      case 'P2005':
        httpStatus = HttpStatus.BAD_REQUEST;
        message = 'Invalid input value';
        break;
      default:
        message = 'Prisma error occurred';
    }

    return {
      httpStatus,
      code: httpStatus,
      message,
      errors,
    };
  }

  private getPrismaValidationDetails(
    exception: Prisma.PrismaClientValidationError,
  ): string {
    return exception.message.split('\n').slice(-1)[0].trim();
  }

  private logError(exception: unknown, errorResponse: any): void {
    const errorMessage =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);

    this.logger.error(`Error: ${errorResponse.message}`, {
      stack: errorMessage,
      context: 'ApiExceptionFilter',
    });
    this.logger.error(errorResponse);
  }
}
