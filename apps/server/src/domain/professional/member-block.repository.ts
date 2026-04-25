import type {ClinicMemberId} from '../clinic-member/entities';
import type {MemberBlock, MemberBlockId} from './entities';

export interface MemberBlockRepository {
    findById(id: MemberBlockId): Promise<MemberBlock | null>;

    findByMember(
        clinicMemberId: ClinicMemberId,
        filters?: {startAt?: Date; endAt?: Date},
    ): Promise<MemberBlock[]>;

    findOverlapping(clinicMemberId: ClinicMemberId, startAt: Date, endAt: Date): Promise<MemberBlock[]>;

    save(block: MemberBlock): Promise<void>;

    delete(id: MemberBlockId): Promise<void>;
}

export abstract class MemberBlockRepository {}
