import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";
import { AppConfigService } from "../config/config.service";

@ApiTags("System")
@Controller("health")
export class HealthController {
  constructor(private readonly config: AppConfigService) {}

  @Get()
  @ApiOperation({ summary: "Health check" })
  @ApiOkResponse({ description: "Service is healthy" })
  health() {
    return {
      status: "ok",
      service: "serveflow-api",
      environment: this.config.get("NODE_ENV") as string,
      timestamp: new Date().toISOString(),
      version: (process.env as Record<string, string | undefined>)["npm_package_version"] || "0.1.0",
    };
  }
}
