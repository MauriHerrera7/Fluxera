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
      const exceptionMessage = this.getExceptionMessage(exception);
      const sanitizedMessage = this.sanitizeSensitiveInfo(exceptionMessage);
      const sanitizedStack =
        exception instanceof Error && exception.stack
          ? this.sanitizeSensitiveInfo(exception.stack)
          : undefined;
      
      const reqId = request?.headers?.['x-request-id'];
      const requestId = reqId ? ` [ReqID: ${reqId}]` : '';

      this.logger.error(
        `${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''}${requestId} - ${sanitizedMessage}`,
        sanitizedStack,
      );
    } else {
      const reqId = request?.headers?.['x-request-id'];
      const requestId = reqId ? ` [ReqID: ${reqId}]` : '';
      this.logger.warn(`${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''}${requestId} - ${payload.message}`);
    }

    response.status(status).json(payload);
  }

  private sanitizeSensitiveInfo(text: string): string {
    if (!text) return text;
    
    // Mask URL credentials: protocol://user:password@host
    let sanitized = text.replace(/([a-zA-Z0-9+.-]+:\/\/[^:]+:)[^@]+(@)/g, '$1***$2');
    
    // Mask potential key=value or key: value for secrets
    sanitized = sanitized.replace(/((?:password|secret|token|key|credential)s?["']?\s*[:=]\s*["']?)[^"'\s,;]+/gi, '$1***');

    // Specific mask for literal database password phrases
    sanitized = sanitized.replace(/(database password )([^\s]+)/gi, '$1***');

    return sanitized;
  }

  private getMessage(exception: unknown, status: number): string {
    // Primera defensa para el cliente: no devolver nunca detalles en errores 500
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error';
    }

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

    return 'Request failed';
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
    // Controlar qué información se manda al logger de forma predeterminada:
    // Si es una excepción controlada, devolvemos su mensaje.
    if (exception instanceof HttpException) {
      return exception.message;
    }

    // Si es un error no controlado, evitamos loguear el mensaje original 
    // en la línea principal del log para prevenir fugas (sanitización actúa en el stack).
    if (exception instanceof Error) {
      return `Unhandled internal error (${exception.name})`;
    }

    return 'Unknown error';
  }
}
