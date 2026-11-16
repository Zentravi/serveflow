import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface ResponseEnvelope<T> {
  statusCode: number;
  data: T;
  timestamp: string;
}

/**
 * Transforms successful responses into a consistent envelope.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((data: T): ResponseEnvelope<T> => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        data,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}
