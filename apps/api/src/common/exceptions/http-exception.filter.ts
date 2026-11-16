import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

/**
 * Global exception filter.
 * Standardizes error responses to the envelope documented in API.md §2.
 * Never leaks stack traces or internal details in production.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string[] = ["Internal server error"];
    let error = "Internal Server Error";

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        message = [exceptionResponse];
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === "object" &&
        "message" in exceptionResponse
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = Array.isArray(resp["message"])
          ? (resp["message"] as string[])
          : [String(resp["message"])];
        error = (resp["error"] as string) || exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.stack, exception.message);
      message = ["Internal server error"];
    }

    const responseBody = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(responseBody);
  }
}
