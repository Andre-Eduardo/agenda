import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {MemberModulesDto} from '@application/clinic-license/dtos';
import {ModuleAccess} from '@domain/clinic-license/services';
import {ClinicRepository} from '@domain/clinic/clinic.repository';

/** Pacotes de IA e módulos de clínica que o membro atual pode usar: o front esconde o resto. */
@Injectable()
export class GetMyModulesService implements ApplicationService<undefined, MemberModulesDto> {
    constructor(
        private readonly moduleAccess: ModuleAccess,
        private readonly clinicRepository: ClinicRepository
    ) {}

    async execute({actor}: Command): Promise<MemberModulesDto> {
        const clinic = await this.clinicRepository.findById(actor.clinicId);

        return new MemberModulesDto(
            await this.moduleAccess.getMemberModules(actor.clinicMemberId),
            await this.moduleAccess.getOperationalModulesOfMember(actor.clinicMemberId),
            clinic?.accountType ?? null
        );
    }
}
