import type {TupleToUnion} from 'type-fest';
import {accountEvents} from '../account/events';
import {auditEvents} from '../audit/events';
import {blockadeEvents} from '../blockade/events';
import {cashierEvents} from '../cashier/events';
import {cleaningEvents} from '../cleaning/events';
import {companyEvents} from '../company/events';
import {customerEvents} from '../customer/events';
import {deepCleaningEvents} from '../deep-cleaning/events';
import {defectEvents} from '../defect/events';
import {defectTypeEvents} from '../defect-type/events';
import {employeeEvents} from '../employee/events';
import {employeePositionEvents} from '../employee-position/events';
import {inspectionEvents} from '../inspection/events';
import {maintenanceEvents} from '../maintenance/events';
import {paymentMethodEvents} from '../payment-method/events';
import {productEvents} from '../product/events';
import {productCategoryEvents} from '../product-category/events';
import {reservationEvents} from '../reservation/events';
import {roomEvents} from '../room/events';
import {roomCategoryEvents} from '../room-category/events';
import {directSaleEvents} from '../sale/events';
import {serviceEvents} from '../service/events';
import {serviceCategoryEvents} from '../service-category/events';
import {stockEvents} from '../stock/events';
import {supplierEvents} from '../supplier/events';
import {transactionEvents} from '../transaction/events';
import {userEvents} from '../user/events';

export const eventTypes = [
    cashierEvents,
    companyEvents,
    customerEvents,
    defectEvents,
    defectTypeEvents,
    directSaleEvents,
    employeeEvents,
    employeePositionEvents,
    paymentMethodEvents,
    productEvents,
    productCategoryEvents,
    reservationEvents,
    roomEvents,
    roomCategoryEvents,
    serviceEvents,
    serviceCategoryEvents,
    stockEvents,
    supplierEvents,
    transactionEvents,
    userEvents,
    cleaningEvents,
    maintenanceEvents,
    inspectionEvents,
    blockadeEvents,
    deepCleaningEvents,
    accountEvents,
    auditEvents,
];

export type DomainEventType = TupleToUnion<TupleToUnion<typeof eventTypes>>;

export type EventType = (typeof eventTypes)[number][number]['type'];
