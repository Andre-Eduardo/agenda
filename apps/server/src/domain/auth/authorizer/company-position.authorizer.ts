import type {CompanyId} from '../../company/entities';
import type {EmployeePositionRepository} from '../../employee-position/employee-position.repository';
import type {UserId} from '../../user/entities';
import type {Permission} from '../permission';
import {Authorizer} from './authorizer';

export class CompanyPositionAuthorizer extends Authorizer {
    constructor(private readonly positionRepository: EmployeePositionRepository) {
        super();
    }

    async getPermissions(companyId: CompanyId | null, userId: UserId): Promise<Set<Permission>> {
        if (companyId === null) {
            return new Set();
        }

        const position = await this.positionRepository.findByUser(companyId, userId);

        if (position === null) {
            return new Set();
        }

        return position.permissions;
    }
}
