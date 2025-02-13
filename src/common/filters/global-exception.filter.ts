import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(@Inject('winston') private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const { status, message, details } = this.handleException(exception);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      details,
    };

    // Log the error
    this.logError(exception, errorResponse);

    response.status(status).json(errorResponse);
  }

  private handleException(exception: unknown): {
    status: number;
    message: string;
    details: any;
  } {
    let message = 'Internal server error';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let details: any = null;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaKnownRequestError(exception);
      message = prismaError.message;
      status = prismaError.status;
      details = prismaError.details;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      message = 'Validation error in Prisma client.';
      status = HttpStatus.BAD_REQUEST;
      details = this.getPrismaValidationDetails(exception);
    } else if (exception instanceof HttpException) {
      message = exception.message;
      status = exception.getStatus();
      details = (exception.getResponse() as any).message;
    } else {
      details = exception;
    }

    return { status, message, details };
  }

  private handlePrismaKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): { message: string; status: number; details: any } {
    let message = 'Internal server error';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const details = exception.meta;

    switch (exception.code) {
      case 'P2025': {
        const targetField = exception.meta?.target as string[] | undefined;
        if (targetField) {
          if (targetField.includes('competition')) {
            message = 'Competition not found for this judge.';
          } else if (targetField.includes('student')) {
            message = 'Student record not found.';
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
        message =
          'Foreign key constraint failed. Please check your references.';
        status = HttpStatus.BAD_REQUEST;
        break;
      }
      case 'P2004': {
        message = 'Transaction failed. Please try again.';
        status = HttpStatus.BAD_REQUEST;
        break;
      }
      case 'P2005': {
        message = 'Invalid input provided. Please check your data.';
        status = HttpStatus.BAD_REQUEST;
        break;
      }
      default: {
        message = exception.message;
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }

    return { message, status, details };
  }

  private getPrismaValidationDetails(
    exception: Prisma.PrismaClientValidationError,
  ): string {
    const errorLines = exception.message.split('\n');
    const relevantDetails = errorLines
      .filter((line) => line.includes('Argument') || line.includes('Invalid'))
      .map((line) => line.trim())
      .join(' | ');

    return `Validation failed: ${relevantDetails || 'No specific details available.'}`;
  }

  private logError(exception: unknown, errorResponse: any): void {
    if (exception instanceof Error) {
      this.logger.error(`Error: ${exception.message}`, {
        stack: exception.stack,
        context: 'GlobalExceptionFilter',
      });
    } else {
      this.logger.error(
        `Unknown error occurred: ${JSON.stringify(exception)}`,
        {
          context: 'GlobalExceptionFilter',
        },
      );
    }

    this.logger.error(`Error Response: ${JSON.stringify(errorResponse)}`, {
      context: 'GlobalExceptionFilter',
    });
  }
}
