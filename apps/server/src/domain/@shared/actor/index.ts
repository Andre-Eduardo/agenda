import type {UserId} from '../../user/entities';

export type MaybeAuthenticatedActor = {
    userId: UserId | null;
    ip: string;
};

export type UnauthenticatedActor = {
    userId: null;
    ip: string;
};

export type Actor = Override<MaybeAuthenticatedActor, {userId: UserId}>;

export const unknownActor: UnauthenticatedActor = {
    userId: null,
    ip: '0.0.0.0',
};
