import type {TupleToUnion} from 'type-fest';
import {appointmentEvents} from '../appointment/events';
import {patientEvents} from '../patient/events';
import {professionalEvents} from '../professional/events';
import {recordEvents} from '../record/events';
import {userEvents} from '../user/events';
import {personEvents} from '../person/events';

export const eventTypes = [userEvents, professionalEvents, appointmentEvents, recordEvents, patientEvents, personEvents];

export type DomainEventType = TupleToUnion<TupleToUnion<typeof eventTypes>>;

export type EventType = (typeof eventTypes)[number][number]['type'];
