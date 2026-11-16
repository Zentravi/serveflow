import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Logs incoming requests and outgoing responses with timing.
 * Structured logging for observability.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept<T>(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<T> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const delay = Date.now() - now;
        this.logger.log(
          `${method} ${url} ${statusCode} ${delay}ms - ${ip}`
        );
      })
    );
  }
}
