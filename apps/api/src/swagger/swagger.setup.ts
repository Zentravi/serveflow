import { INestApplication, Logger } from "@nestjs/common";
import {
  DocumentBuilder,
  SwaggerModule,
} from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
  const logger = new Logger("Swagger");

  const config = new DocumentBuilder()
    .setTitle("ServeFlow API")
    .setDescription(
      "Multi-tenant business operations and appointment booking platform"
    )
    .setVersion("1.0")
    .addTag("system", "Health check")
    .addTag("auth", "Authentication endpoints")
    .addTag("businesses", "Business profile and settings")
    .addTag("memberships", "Business memberships and roles")
    .addTag("staff", "Staff profiles and schedules")
    .addTag("services", "Service catalog")
    .addTag("customers", "Customer directory")
    .addTag("appointments", "Booking engine and availability")
    .addTag("payments", "Payment records")
    .addTag("notifications", "Notifications")
    .addTag("audit", "Audit log")
    .addTag("admin", "Super-admin platform operations")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customSiteTitle: "ServeFlow API Docs",
  });

  logger.log("Swagger documentation available at /api/v1/docs");
}
