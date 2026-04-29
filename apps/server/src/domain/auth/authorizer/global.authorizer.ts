import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { UserId } from "@domain/user/entities";
import type { UserRepository } from "@domain/user/user.repository";
import { GlobalRole } from "@domain/auth/global-role";
import { Permission, UserPermission } from "@domain/auth/permission";
import { Authorizer } from "@domain/auth/authorizer/authorizer";

export const permissionsMap: Record<GlobalRole, Set<Permission>> = {
  [GlobalRole.SUPER_ADMIN]: Permission.all(),
  [GlobalRole.OWNER]: Permission.all(),
  [GlobalRole.NONE]: new Set([UserPermission.VIEW_PROFILE, UserPermission.CHANGE_PASSWORD]),
};

export class GlobalAuthorizer extends Authorizer {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async getPermissions(_: ClinicMemberId | null, userId: UserId): Promise<Set<Permission>> {
    const user = await this.userRepository.findById(userId);

    if (user === null) {
      return new Set();
    }

    return permissionsMap[user.globalRole];
  }
}
