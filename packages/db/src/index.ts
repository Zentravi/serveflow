/**
 * @serveflow/db — Database package for ServeFlow.
 *
 * Exports the Prisma client and database utilities.
 * The Prisma schema lives in prisma/schema.prisma and migrations live in
 * prisma/migrations/. The exclusion constraint
 * (`appointment_no_overlap`) is defined as a raw SQL migration
 * (prisma/migrations/0002_appointment_no_overlap/migration.sql) because
 * Prisma cannot declaratively express PostgreSQL EXCLUDE USING gist.
 */

export { PrismaClient } from "@prisma/client";

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default prisma;
