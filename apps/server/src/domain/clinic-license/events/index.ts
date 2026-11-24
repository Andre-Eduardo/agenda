import {ClinicLicenseChangedEvent} from '@domain/clinic-license/events/clinic-license-changed.event';
import {ClinicModuleAssignedEvent} from '@domain/clinic-license/events/clinic-module-assigned.event';
import {ClinicModuleUnassignedEvent} from '@domain/clinic-license/events/clinic-module-unassigned.event';
import {ProfessionalExtraSeatAddedEvent} from '@domain/clinic-license/events/professional-extra-seat-added.event';

export * from '@domain/clinic-license/events/clinic-license-changed.event';
export * from '@domain/clinic-license/events/clinic-module-assigned.event';
export * from '@domain/clinic-license/events/clinic-module-unassigned.event';
export * from '@domain/clinic-license/events/professional-extra-seat-added.event';

export const clinicLicenseEvents = [
    ClinicLicenseChangedEvent,
    ClinicModuleAssignedEvent,
    ClinicModuleUnassignedEvent,
    ProfessionalExtraSeatAddedEvent,
];
