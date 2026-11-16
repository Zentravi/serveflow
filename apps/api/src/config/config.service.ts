import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import type { Env } from "./env.schema";

@Injectable()
export class AppConfigService {
  constructor(private readonly config: NestConfigService) {}

  get<K extends keyof Env>(key: K): Env[K] | undefined {
    return this.config.get(key);
  }

  getRequired<K extends keyof Env>(key: K): NonNullable<Env[K]> {
    const value = this.config.get(key);
    if (value === undefined) {
      throw new Error(`Missing required environment variable: ${key as string}`);
    }
    return value as NonNullable<Env[K]>;
  }

  getPort(): number {
    return this.getRequired("PORT");
  }

  getDatabaseUrl(): string {
    return this.getRequired("DATABASE_URL");
  }

  getFrontendUrl(): string {
    return this.getRequired("FRONTEND_URL");
  }

  getBackendUrl(): string {
    return this.getRequired("BACKEND_URL");
  }

  getSessionSecret(): string {
    return this.getRequired("SESSION_SECRET");
  }

  getSessionMaxAge(): number {
    return this.getRequired("SESSION_MAX_AGE");
  }

  getCorsOrigin(): string {
    return this.getRequired("CORS_ORIGIN");
  }

  getResendApiKey(): string | undefined {
    return this.config.get<string | undefined>("RESEND_API_KEY");
  }

  getSuperAdminRegistrationCode(): string | undefined {
    return this.config.get<string | undefined>("SUPER_ADMIN_REGISTRATION_CODE");
  }

  isProduction(): boolean {
    return this.config.get("NODE_ENV") === "production";
  }

  isDevelopment(): boolean {
    return this.config.get("NODE_ENV") === "development";
  }
}
