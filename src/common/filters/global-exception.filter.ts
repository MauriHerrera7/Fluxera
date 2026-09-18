import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = {
      statusCode: status,
      message: this.getMessage(exception, status),
      error: this.getErrorName(exception, status),
      path: request?.url ?? undefined,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''} - ${this.getExceptionMessage(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''} - ${payload.message}`);
    }

    response.status(status).json(payload);
  }

  private getMessage(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (response && typeof response === 'object' && 'message' in response) {
        const { message } = response;

        if (Array.isArray(message)) {
          return message[0];
        }

        if (typeof message === 'string') {
          return message;
        }
      }
    }

    return status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal server error'
      : 'Request failed';
  }

  private getErrorName(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (response && typeof response === 'object' && 'error' in response) {
        const { error } = response;

        if (typeof error === 'string') {
          return error;
        }
      }

      return exception.name;
    }

    return status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal Server Error' : 'Request Failed';
  }

  private getExceptionMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    return 'Unknown error';
  }
}
