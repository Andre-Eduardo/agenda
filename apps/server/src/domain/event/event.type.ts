import type {TupleToUnion} from 'type-fest';

import {userEvents} from '../user/events';
import {professionalEvents} from '../professional/events';
import { appointmentEvents } from '../appointment/events';
import { recordEvents } from '../record/events';
import { patientEvents } from '../patient/events';
export const eventTypes = [
    userEvents,
    professionalEvents,
    appointmentEvents,
    recordEvents,
    patientEvents,
];

export type DomainEventType = TupleToUnion<TupleToUnion<typeof eventTypes>>;

export type EventType = (typeof eventTypes)[number][number]['type'];
