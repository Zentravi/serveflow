import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from "@nestjs/common";
import { ZodSchema, ZodError } from "zod";

/**
 * Zod validation pipe for request body, query, and params validation.
 * Returns 400 with validation error details on failure.
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    const { type } = metadata;
    const metatype = type as "BODY" | "QUERY" | "PARAMS" | string;
    if (metatype !== "BODY" && metatype !== "QUERY" && metatype !== "PARAMS") {
      return value;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => {
          const path = e.path.length ? e.path.join(".") : "root";
          return `${path}: ${e.message}`;
        });
        throw new BadRequestException({
          statusCode: 400,
          message: messages,
          error: "Bad Request",
        });
      }
      throw new BadRequestException({
        statusCode: 400,
        message: ["Validation failed"],
        error: "Bad Request",
      });
    }
  }
}
