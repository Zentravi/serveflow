import { Module } from "@nestjs/common";
import {
  ConfigModule as NestConfigModule,
  ConfigService as NestConfigService,
} from "@nestjs/config";
import { EnvSchema, Env } from "./env.schema";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      ignoreEnvFile: process.env["NODE_ENV"] === "production",
      validate: (config: Record<string, unknown>) => {
        const result = EnvSchema.safeParse(config);
        if (!result.success) {
          const issues = result.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", ");
          throw new Error(`Invalid environment variables: ${issues}`);
        }
        return result.data as Env;
      },
    }),
  ],
  providers: [NestConfigService],
  exports: [NestConfigService],
})
export class AppConfigModule {}
