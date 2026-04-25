import type {ClinicId} from '../../clinic/entities';
import type {ClinicMemberId} from '../../clinic-member/entities';
import type {UserId} from '../../user/entities';

export type MaybeAuthenticatedActor = {
    userId: UserId | null;
    clinicId: ClinicId | null;
    clinicMemberId: ClinicMemberId | null;
    ip: string;
};

export type UnauthenticatedActor = {
    userId: null;
    clinicId: null;
    clinicMemberId: null;
    ip: string;
};

export type Actor = Override<
    MaybeAuthenticatedActor,
    {userId: UserId; clinicId: ClinicId; clinicMemberId: ClinicMemberId}
>;

export const unknownActor: UnauthenticatedActor = {
    userId: null,
    clinicId: null,
    clinicMemberId: null,
    ip: '0.0.0.0',
};
