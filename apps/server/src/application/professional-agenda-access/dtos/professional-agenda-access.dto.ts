import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {ProfessionalAgendaAccess} from '@domain/professional-agenda-access/entities';

@ApiSchema({name: 'ProfessionalAgendaAccess'})
export class ProfessionalAgendaAccessDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'Clinic id'})
    clinicId: string;

    @ApiProperty({format: 'uuid', description: 'Member who was granted access (e.g. a secretary)'})
    granteeMemberId: string;

    @ApiProperty({format: 'uuid', description: 'Professional whose agenda can be managed'})
    professionalMemberId: string;

    @ApiProperty({type: String, nullable: true, description: 'Optional reason for the grant'})
    reason: string | null;

    constructor(access: ProfessionalAgendaAccess) {
        super(access);
        this.clinicId = access.clinicId.toString();
        this.granteeMemberId = access.granteeMemberId.toString();
        this.professionalMemberId = access.professionalMemberId.toString();
        this.reason = access.reason;
    }
}
