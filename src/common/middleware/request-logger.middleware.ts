import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    
    // Inject into headers for downstream access
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl } = req;
      const { statusCode } = res;
      
      // Skip logging frequent health checks to avoid noise
      if (originalUrl.startsWith('/health')) {
        return;
      }

      const logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms [ReqID: ${requestId}]`;
      
      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
