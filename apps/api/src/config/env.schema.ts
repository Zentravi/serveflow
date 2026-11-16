/**
 * ServeFlow environment variable schema.
 * All environment variables are validated with Zod at application bootstrap.
 * Missing or invalid variables cause the application to fail fast.
 */

import { z } from "zod";

export const EnvSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("4000").transform(Number),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  BACKEND_URL: z.string().url().default("http://localhost:4000"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Session
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .default("change-me-in-production-min-32-chars")
    .refine(
      (val) => {
        if (process.env["NODE_ENV"] === "production") {
          return val !== "change-me-in-production-min-32-chars";
        }
        return true;
      },
      {
        message:
          "SESSION_SECRET must be set to a secure value in production",
      }
    ),
  SESSION_MAX_AGE: z.string().default("1209600000").transform(Number),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Email (notifications — synchronous at MVP)
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Super-admin registration code (one-time setup)
  SUPER_ADMIN_REGISTRATION_CODE: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
