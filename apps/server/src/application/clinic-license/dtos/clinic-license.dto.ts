import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {ClinicLicense} from '@domain/clinic-license/entities';
import {ModuleType, OperationalModuleType} from '@domain/clinic-license/models';
import {ClinicAccountType} from '@domain/clinic/entities';

@ApiSchema({name: 'ClinicLicenseProfessionals'})
export class ClinicLicenseProfessionalsDto {
    @ApiProperty({description: 'Professionals covered by the plan price'})
    included: number;

    @ApiProperty({description: 'Professionals added above the plan, charged as extra'})
    extra: number;

    @ApiProperty({type: 'integer', nullable: true, description: 'Plan ceiling; null means unlimited extras'})
    max: number | null;

    @ApiProperty({description: 'Active members with the PROFESSIONAL role'})
    active: number;

    constructor(license: ClinicLicense, active: number) {
        this.included = license.includedProfessionals;
        this.extra = license.extraProfessionals;
        this.max = license.maxProfessionals;
        this.active = active;
    }
}

@ApiSchema({name: 'ClinicLicenseModule'})
export class ClinicLicenseModuleDto {
    @ApiProperty({enum: ModuleType, enumName: 'ModuleType'})
    type: ModuleType;

    @ApiProperty()
    includedSeats: number;

    @ApiProperty()
    extraSeats: number;

    @ApiProperty({type: 'integer', nullable: true, description: 'null means unlimited extras'})
    maxSeats: number | null;

    @ApiProperty({type: [String], format: 'uuid', description: 'Clinic members assigned to this module'})
    memberIds: string[];

    constructor(license: ClinicLicense, type: ModuleType) {
        const seats = license.modules.get(type) ?? {includedSeats: 0, extraSeats: 0, maxSeats: 0};

        this.type = type;
        this.includedSeats = seats.includedSeats;
        this.extraSeats = seats.extraSeats;
        this.maxSeats = seats.maxSeats;
        this.memberIds = license.membersOf(type).map((id) => id.toString());
    }
}

@ApiSchema({name: 'ClinicLicense'})
export class ClinicLicenseDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({type: ClinicLicenseProfessionalsDto})
    professionals: ClinicLicenseProfessionalsDto;

    @ApiProperty({type: [ClinicLicenseModuleDto], description: 'Contracted modules'})
    modules: ClinicLicenseModuleDto[];

    constructor(license: ClinicLicense, activeProfessionals: number) {
        this.clinicId = license.clinicId.toString();
        this.professionals = new ClinicLicenseProfessionalsDto(license, activeProfessionals);
        this.modules = [...license.modules.keys()].map((type) => new ClinicLicenseModuleDto(license, type));
    }
}

@ApiSchema({name: 'MemberModules'})
export class MemberModulesDto {
    @ApiProperty({enum: ModuleType, enumName: 'ModuleType', isArray: true, description: 'AI modules'})
    modules: ModuleType[];

    @ApiProperty({
        enum: OperationalModuleType,
        enumName: 'OperationalModuleType',
        isArray: true,
        description: 'Clinic modules (team, reception) enabled for the account',
    })
    operationalModules: OperationalModuleType[];

    @ApiProperty({
        enum: ClinicAccountType,
        enumName: 'ClinicAccountType',
        nullable: true,
        description: 'SOLO = autônomo; CLINIC = clínica com equipe. Null outside a clinic.',
    })
    accountType: ClinicAccountType | null;

    constructor(
        modules: Iterable<ModuleType>,
        operationalModules: Iterable<OperationalModuleType> = [],
        accountType: ClinicAccountType | null = null
    ) {
        this.modules = [...modules];
        this.operationalModules = [...operationalModules];
        this.accountType = accountType;
    }
}
