import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicLicenseDto, type SetModuleMembersDto} from '@application/clinic-license/dtos';
import {InvalidInputException} from '@domain/@shared/exceptions';
import {ClinicLicenseRepository} from '@domain/clinic-license/clinic-license.repository';
import {ClinicLicense} from '@domain/clinic-license/entities';
import {countProfessionalSeats, occupiesProfessionalSeat} from '@domain/clinic-license/services';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {EventDispatcher} from '@domain/event';

/**
 * O gestor escolhe quem usa um pacote. A lista é completa: quem sai perde o pacote
 * (a vaga extra já paga continua até o próximo ciclo); quem entra acima das vagas
 * contratadas exige `acceptExtraCharge`.
 */
@Injectable()
export class SetModuleMembersService implements ApplicationService<SetModuleMembersDto, ClinicLicenseDto> {
    constructor(
        private readonly clinicLicenseRepository: ClinicLicenseRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<SetModuleMembersDto>): Promise<ClinicLicenseDto> {
        const license =
            (await this.clinicLicenseRepository.findByClinicId(actor.clinicId)) ??
            ClinicLicense.create({clinicId: actor.clinicId});
        const members = await this.clinicMemberRepository.findByClinicId(actor.clinicId);
        const wanted = [...new Set(payload.clinicMemberIds)].map((id) => ClinicMemberId.from(id));

        for (const memberId of wanted) {
            const member = members.find((candidate) => candidate.id.equals(memberId));

            if (member === undefined || !occupiesProfessionalSeat(member)) {
                throw new InvalidInputException(
                    'AI modules can only be assigned to active professionals of the clinic.',
                    [{field: 'clinicMemberIds', reason: memberId.toString()}]
                );
            }
        }

        for (const current of license.membersOf(payload.moduleType)) {
            if (!wanted.some((memberId) => memberId.equals(current))) license.unassign(payload.moduleType, current);
        }

        for (const memberId of wanted) {
            license.assign(payload.moduleType, memberId, {acceptExtraCharge: payload.acceptExtraCharge});
        }

        await this.clinicLicenseRepository.save(license);
        this.eventDispatcher.dispatch(actor, license);

        return new ClinicLicenseDto(license, countProfessionalSeats(members));
    }
}
