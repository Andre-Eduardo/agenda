import {ClinicPatientAccessGrantedEvent} from './clinic-patient-access-granted.event';
import {ClinicPatientAccessChangedEvent} from './clinic-patient-access-changed.event';
import {ClinicPatientAccessRevokedEvent} from './clinic-patient-access-revoked.event';

export * from './clinic-patient-access-granted.event';
export * from './clinic-patient-access-changed.event';
export * from './clinic-patient-access-revoked.event';

export const clinicPatientAccessEvents = [
    ClinicPatientAccessGrantedEvent,
    ClinicPatientAccessChangedEvent,
    ClinicPatientAccessRevokedEvent,
];
