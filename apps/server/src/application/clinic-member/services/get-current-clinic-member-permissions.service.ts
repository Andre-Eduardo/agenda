import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicMemberPermissionsDto} from '@application/clinic-member/dtos';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {Authorizer} from '@domain/auth/authorizer';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';

@Injectable()
export class GetCurrentClinicMemberPermissionsService implements ApplicationService<
    undefined,
    ClinicMemberPermissionsDto
> {
    constructor(
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly authorizer: Authorizer
    ) {}

    async execute({actor}: Command): Promise<ClinicMemberPermissionsDto> {
        const member = await this.clinicMemberRepository.findById(actor.clinicMemberId);

        if (
            member === null ||
            !member.isActive ||
            !member.userId.equals(actor.userId) ||
            !member.clinicId.equals(actor.clinicId)
        ) {
            throw new AccessDeniedException(
                'The selected clinic member is not active for this user.',
                AccessDeniedReason.NOT_ALLOWED
            );
        }

        const permissions = await this.authorizer.getPermissions(actor.clinicMemberId, actor.userId);

        return new ClinicMemberPermissionsDto(permissions);
    }
}
