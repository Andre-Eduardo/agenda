import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {ClinicDto} from '@application/clinic/dtos';
import {UserDto} from '@application/user/dtos';

@ApiSchema({name: 'SoloOnboarding'})
export class SoloOnboardingDto {
    @ApiProperty({type: UserDto})
    user: UserDto;

    @ApiProperty({type: ClinicDto, description: 'The solo account (accountType = SOLO)'})
    clinic: ClinicDto;

    @ApiProperty({format: 'uuid', description: 'The single member (OWNER + PROFESSIONAL) of the account'})
    clinicMemberId: string;

    @ApiProperty({format: 'uuid'})
    professionalId: string;

    constructor(props: {user: UserDto; clinic: ClinicDto; clinicMemberId: string; professionalId: string}) {
        this.user = props.user;
        this.clinic = props.clinic;
        this.clinicMemberId = props.clinicMemberId;
        this.professionalId = props.professionalId;
    }
}
