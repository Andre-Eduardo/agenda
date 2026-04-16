import type {ProfessionalId} from '../../professional/entities';
import type {UserId} from '../../user/entities';

export type MaybeAuthenticatedActor = {
    userId: UserId | null;
    professionalId: ProfessionalId | null;
    ip: string;
};

export type UnauthenticatedActor = {
    userId: null;
    professionalId: null;
    ip: string;
};

export type Actor = Override<MaybeAuthenticatedActor, {userId: UserId; professionalId: ProfessionalId | null}>;

export const unknownActor: UnauthenticatedActor = {
    userId: null,
    professionalId: null,
    ip: '0.0.0.0',
};
