import { SetMetadata } from "@nestjs/common";
import type { MembershipRole } from "@serveflow/types";

export const Roles = (...roles: MembershipRole[]) =>
  SetMetadata("roles", roles);
