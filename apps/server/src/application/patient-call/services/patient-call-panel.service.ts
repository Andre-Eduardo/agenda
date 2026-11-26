import {Inject, Injectable} from '@nestjs/common';
import {InvalidInputException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientCallIdentity} from '@domain/patient-call/patient-call.repository';
import {PatientCallRepository} from '@domain/patient-call/patient-call.repository';

function luminance(hex: string): number {
    const channels = [0.2126, 0.7152, 0.0722];

    return channels.reduce((sum, weight, index) => {
        const offset = index * 2 + 1;
        const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
        const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

        return sum + weight * linear;
    }, 0);
}

@Injectable()
export class PatientCallPanelService {
    constructor(@Inject(PatientCallRepository) private readonly repository: PatientCallRepository) {}

    async getAvailability(clinicId: ClinicId) {
        const {enabled, publicToken} = await this.repository.getPanel(clinicId);

        return {enabled, published: publicToken !== null};
    }

    getSettings(clinicId: ClinicId) {
        return this.repository.getPanel(clinicId);
    }

    saveSettings(clinicId: ClinicId, identity: PatientCallIdentity) {
        const foreground = luminance(identity.foregroundColor);
        const background = luminance(identity.backgroundColor);

        if ((Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05) < 4.5) {
            throw new InvalidInputException(
                'Patient call display colors must have a contrast ratio of at least 4.5:1.'
            );
        }

        return this.repository.savePanel(clinicId, identity);
    }

    publish(clinicId: ClinicId) {
        return this.repository.publishPanel(clinicId);
    }

    revoke(clinicId: ClinicId) {
        return this.repository.revokePanel(clinicId);
    }

    async getDisplay(token: string | undefined) {
        const panel =
            token !== undefined && /^[a-f0-9]{64}$/.test(token) ? await this.repository.getPublicPanel(token) : null;

        if (panel === null) throw new ResourceNotFoundException('Patient call display is unavailable.');

        return panel;
    }
}
