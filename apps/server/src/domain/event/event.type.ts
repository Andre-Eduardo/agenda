import type {TupleToUnion} from 'type-fest';
import {appointmentEvents} from '../appointment/events';
import {clinicalProfileEvents} from '../clinical-profile/events';
import {fileEvents} from '../file/events';
import {patientAlertEvents} from '../patient-alert/events';
import {patientEvents} from '../patient/events';
import {patientFormEvents} from '../patient-form/events';
import {professionalEvents} from '../professional/events';
import {recordEvents} from '../record/events';
import {userEvents} from '../user/events';
import {personEvents} from '../person/events';

export const eventTypes = [userEvents, professionalEvents, appointmentEvents, recordEvents, patientEvents, personEvents, fileEvents, clinicalProfileEvents, patientAlertEvents, patientFormEvents];

export type DomainEventType = TupleToUnion<TupleToUnion<typeof eventTypes>>;

export type EventType = (typeof eventTypes)[number][number]['type'];
