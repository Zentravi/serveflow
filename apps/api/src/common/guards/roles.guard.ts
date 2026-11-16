import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { MembershipRole } from "@serveflow/types";

/**
 * RolesGuard stub — Phase 2 foundation.
 * Checks MembershipRole within the active business context.
 * Actual enforcement implemented in Phase 3.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<MembershipRole[]>("roles", context.getHandler()) ||
      [];
    if (!requiredRoles.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.user?.role;
    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException("Insufficient role");
    }
    return true;
  }
}
