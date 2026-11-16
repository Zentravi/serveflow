import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PlatformRole } from "@serveflow/types";

/**
 * SuperAdminGuard stub — Phase 2 foundation.
 * Checks User.platformRole = SUPER_ADMIN.
 * Independent of any business membership.
 * Actual enforcement implemented in Phase 3.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isSuperAdminRoute =
      this.reflector.get<boolean>("superAdmin", context.getHandler()) ||
      false;
    if (!isSuperAdminRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const platformRole = request.user?.platformRole as PlatformRole | undefined;
    if (platformRole !== "SUPER_ADMIN") {
      throw new ForbiddenException("Super-admin access required");
    }
    return true;
  }
}
