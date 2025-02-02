import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'Internal server error';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let details: any = null;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025': {
          // Record not found
          const targetField = exception.meta?.target as string[] | undefined;
          if (targetField) {
            if (targetField.includes('competition')) {
              message = 'Competition not found for this judge.';
            } else if (targetField.includes('student')) {
              message = 'student record not found.';
            } else {
              message = 'Record not found or invalid UUID.';
            }
          } else {
            message = 'Record not found or invalid UUID.';
          }
          status = HttpStatus.NOT_FOUND;
          break;
        }
        case 'P2002': {
          // Unique constraint error
          const targetField = exception.meta?.target as string[] | undefined;
          if (targetField && targetField.includes('email')) {
            message = 'Email already used. Please use another email.';
          } else if (targetField && targetField.includes('name')) {
            message = 'Name already used. Please use another name.';
          } else if (targetField && targetField.includes('slug')) {
            message = 'Slug already used. Please use another slug.';
          } else {
            message = 'Unique constraint violation occurred.';
          }
          status = HttpStatus.CONFLICT;
          break;
        }
        case 'P2003': {
          // Foreign key constraint failed
          message =
            'Foreign key constraint failed. Please check your references.';
          status = HttpStatus.BAD_REQUEST;
          break;
        }
        case 'P2004': {
          // Transaction failed
          message = 'Transaction failed. Please try again.';
          status = HttpStatus.BAD_REQUEST;
          break;
        }
        case 'P2005': {
          // Invalid input
          message = 'Invalid input provided. Please check your data.';
          status = HttpStatus.BAD_REQUEST;
          break;
        }
        default: {
          message = exception.message;
          status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
      }
      details = exception.meta;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      message = 'Validation error in Prisma client.';
      status = HttpStatus.BAD_REQUEST;
      details = this.getPrismaValidationDetails(exception);
    } else if (exception instanceof HttpException) {
      // Handle HttpException errors
      message = exception.message;
      status = exception.getStatus();
      details = (exception.getResponse() as any).message;
    } else {
      // Handle other exceptions
      details = exception;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      message,
    };

    response.status(status).json(errorResponse);
  }

  private getPrismaValidationDetails(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
  ): string {
    if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.meta &&
      typeof exception.meta.cause === 'string'
    ) {
      return exception.meta.cause;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      const errorLines = exception.message.split('\n');
      const relevantDetails = errorLines
        .filter((line) => line.includes('Argument') || line.includes('Invalid'))
        .map((line) => line.trim())
        .join(' | ');

      return `Validation failed: ${relevantDetails || 'No specific details available.'}`;
    }
    return exception.message;
  }
}
