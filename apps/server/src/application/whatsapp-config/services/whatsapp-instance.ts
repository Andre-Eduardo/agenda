import {PreconditionException} from '@domain/@shared/exceptions';
import type {ClinicId} from '@domain/clinic/entities';
import {WhatsAppConfigExceptions} from '@domain/notification/notification.exceptions';
import {EvolutionApiError, type EvolutionApiClient} from '@infrastructure/whatsapp/evolution-api.client';

/** Each clinic owns exactly one Evolution instance, named after the clinic id (plexter convention). */
export function instanceNameOf(clinicId: ClinicId): string {
    return clinicId.toString();
}

export function assertEnabled(client: EvolutionApiClient): void {
    if (!client.isEnabled) {
        throw new PreconditionException(WhatsAppConfigExceptions.disabled);
    }
}

export function isNotFound(error: unknown): boolean {
    return error instanceof EvolutionApiError && error.status === 404;
}

/** Instance phone number: `number` when set, otherwise the user part of `ownerJid` (`5511...@s.whatsapp.net`). */
export function phoneNumberOf(instance: {number?: string | null; ownerJid?: string | null}): string | null {
    if (instance.number) return instance.number;

    if (instance.ownerJid) return instance.ownerJid.split('@')[0] ?? null;

    return null;
}

export function toError(error: unknown): Error | undefined {
    return error instanceof Error ? error : undefined;
}
