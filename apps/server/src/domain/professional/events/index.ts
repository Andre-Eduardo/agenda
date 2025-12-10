import { ProfessionalChangedEvent } from './professional-changed.event';
import { ProfessionalCreatedEvent } from './professional-created.event';
import { ProfessionalDeletedEvent } from './professional-deleted.event';

export * from './professional-created.event';
export * from './professional-changed.event';
export * from './professional-deleted.event';
export * from './professional.domain.event';

export const professionalEvents = [
    ProfessionalCreatedEvent,
    ProfessionalChangedEvent,
    ProfessionalDeletedEvent,
];