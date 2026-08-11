import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string;
  errors?: string[];
  path: string;
  timestamp: string;
}

/**
 * Respuesta de error uniforme para el frontend: siempre `message` legible en
 * español y `errors` con el detalle de validación cuando existe.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpError');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocurrió un error inesperado. Intenta de nuevo.';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else if (payload && typeof payload === 'object') {
        const raw = (payload as { message?: string | string[] }).message;
        if (Array.isArray(raw)) {
          errors = raw;
          message = raw[0] ?? 'Datos inválidos.';
        } else if (raw) {
          message = raw;
        }
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.originalUrl} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
