import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {MemberModulesDto} from '@application/clinic-license/dtos';
import {ModuleAccess} from '@domain/clinic-license/services';

/** Pacotes que o membro atual pode usar: o front esconde o resto. */
@Injectable()
export class GetMyModulesService implements ApplicationService<undefined, MemberModulesDto> {
    constructor(private readonly moduleAccess: ModuleAccess) {}

    async execute({actor}: Command): Promise<MemberModulesDto> {
        return new MemberModulesDto(await this.moduleAccess.getMemberModules(actor.clinicMemberId));
    }
}
