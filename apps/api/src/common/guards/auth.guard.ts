import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * AuthGuard stub — Phase 2 foundation.
 * Actual session validation is implemented in Phase 3.
 * This guard provides the structure for authenticated endpoints.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Phase 3: validate sessionId cookie and server-side session store.
    const isAuthenticated = !!request.user;
    if (!isAuthenticated) {
      throw new UnauthorizedException("Authentication required");
    }
    return true;
  }
}
