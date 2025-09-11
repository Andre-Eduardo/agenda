import {CompanyChangedEvent} from './company-changed.event';
import {CompanyCreatedEvent} from './company-created.event';
import {CompanyDeletedEvent} from './company-deleted.event';

export * from './company-changed.event';
export * from './company-created.event';
export * from './company-deleted.event';
export * from './company.domain.event';

export const companyEvents = [CompanyChangedEvent, CompanyCreatedEvent, CompanyDeletedEvent];
