/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { PrometheusService } from '../../prometheus/prometheus.service';
import { AppLogger } from '../logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLogger,
    private readonly metricsService: PrometheusService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Request ID oluştur
    const requestId = uuidv4();
    request['requestId'] = requestId;

    const startTime = Date.now();
    const { method, url, ip, headers } = request;
    const user = request['user'] as { userId: string };

    // Metrics: Start request
    this.metricsService.startHttpRequest(method, url);

    // Request log
    this.logger.info('Incoming request', {
      requestId,
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      userId: user?.userId || 'anonymous',
      body: this.sanitizeBody(request.body),
    });

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;

        // Metrics: Record HTTP request
        this.metricsService.recordHttpRequest(
          method,
          url,
          response.statusCode,
          duration,
        );
        this.metricsService.endHttpRequest(method, url);

        // Success response log
        this.logger.info('Request completed', {
          requestId,
          method,
          url,
          statusCode: response.statusCode,
          duration: `${duration}ms`,
          userId: user?.userId || 'anonymous',
          responseSize: JSON.stringify(data).length,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Metrics: Record HTTP request (error)
        this.metricsService.recordHttpRequest(
          method,
          url,
          error.status || 500,
          duration,
        );
        this.metricsService.endHttpRequest(method, url);

        // Error log
        this.logger.error(
          'Request failed',
          error instanceof Error ? error.stack : undefined,
          {
            requestId,
            method,
            url,
            statusCode: error.status || 500,
            duration: `${duration}ms`,
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: user?.userId || 'anonymous',
          },
        );

        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    // Hassas bilgileri maskele
    const sanitized = { ...body };
    if (sanitized.password) {
      sanitized.password = '***';
    }
    if (sanitized.token) {
      sanitized.token = '***';
    }

    return sanitized;
  }
}
