import type {TupleToUnion} from 'type-fest';
import {appointmentEvents} from '../appointment/events';
import {clinicEvents} from '../clinic/events';
import {clinicMemberEvents} from '../clinic-member/events';
import {clinicPatientAccessEvents} from '../clinic-patient-access/events';
import {clinicalProfileEvents} from '../clinical-profile/events';
import {documentPermissionEvents} from '../document-permission/events';
import {fileEvents} from '../file/events';
import {patientAlertEvents} from '../patient-alert/events';
import {patientEvents} from '../patient/events';
import {patientFormEvents} from '../patient-form/events';
import {personEvents} from '../person/events';
import {professionalEvents} from '../professional/events';
import {recordEvents} from '../record/events';
import {userEvents} from '../user/events';

export const eventTypes = [
    userEvents,
    professionalEvents,
    appointmentEvents,
    recordEvents,
    patientEvents,
    personEvents,
    fileEvents,
    clinicalProfileEvents,
    patientAlertEvents,
    patientFormEvents,
    clinicEvents,
    clinicMemberEvents,
    clinicPatientAccessEvents,
    documentPermissionEvents,
];

export type DomainEventType = TupleToUnion<TupleToUnion<typeof eventTypes>>;

export type EventType = (typeof eventTypes)[number][number]['type'];
