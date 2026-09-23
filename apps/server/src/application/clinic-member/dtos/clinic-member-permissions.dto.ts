import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {Permission} from '@domain/auth/permission';

@ApiSchema({name: 'ClinicMemberPermissions'})
export class ClinicMemberPermissionsDto {
    @ApiProperty({
        type: String,
        isArray: true,
        description: 'Effective permission identifiers for the selected clinic member',
    })
    permissions: Permission[];

    constructor(permissions: Set<Permission>) {
        this.permissions = [...permissions].toSorted((first, second) => first.localeCompare(second));
    }
}
