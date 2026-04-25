import type {ClinicId} from '../clinic/entities';
import type {UserId} from '../user/entities';
import type {ClinicMember, ClinicMemberId, ClinicMemberRole} from './entities';

export type ClinicMemberSearchFilter = {
    clinicId?: ClinicId;
    userId?: UserId;
    role?: ClinicMemberRole;
    isActive?: boolean;
};

export interface ClinicMemberRepository {
    findById(id: ClinicMemberId): Promise<ClinicMember | null>;
    findByClinicAndUser(clinicId: ClinicId, userId: UserId): Promise<ClinicMember | null>;
    findByUserId(userId: UserId): Promise<ClinicMember[]>;
    findByClinicId(clinicId: ClinicId): Promise<ClinicMember[]>;
    save(member: ClinicMember): Promise<void>;
}

export abstract class ClinicMemberRepository {}
