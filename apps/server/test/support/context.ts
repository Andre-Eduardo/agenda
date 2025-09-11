import {execSync} from 'child_process';
import {randomBytes} from 'crypto';
import {resolve} from 'path';
import {World} from '@cucumber/cucumber';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import type {Express} from 'express';
import * as supertest from 'supertest';
import type {Jsonifiable, JsonObject} from 'type-fest';
import type {JsonifiableObject} from 'type-fest/source/jsonifiable';
import {SimulatedClock} from 'xstate';
import {AppModule} from '../../src/app.module';
import type {Log} from '../../src/application/@shared/logger';
import {Logger, LogLevel} from '../../src/application/@shared/logger';
import type {EntityId} from '../../src/domain/@shared/entity/id';
import type {AccountId} from '../../src/domain/account/entities';
import type {CashierId} from '../../src/domain/cashier/entities';
import type {CompanyId} from '../../src/domain/company/entities';
import type {DefectId} from '../../src/domain/defect/entities';
import type {DefectTypeId} from '../../src/domain/defect-type/entities';
import type {EmployeePositionId} from '../../src/domain/employee-position/entities';
import type {PaymentMethodId} from '../../src/domain/payment-method/entities';
import type {PersonId} from '../../src/domain/person/entities';
import type {ProductId} from '../../src/domain/product/entities';
import type {ProductCategoryId} from '../../src/domain/product-category/entities';
import type {ReservationId} from '../../src/domain/reservation/entities';
import type {RoomId} from '../../src/domain/room/entities';
import {RoomMachineFactory} from '../../src/domain/room/state-machine';
import type {RoomCategoryId} from '../../src/domain/room-category/entities';
import type {RoomStatusId} from '../../src/domain/room-status/entities';
import type {SaleId} from '../../src/domain/sale/entities';
import type {ServiceId} from '../../src/domain/service/entities';
import type {ServiceCategoryId} from '../../src/domain/service-category/entities';
import type {StockId} from '../../src/domain/stock/entities';
import type {TransactionId} from '../../src/domain/transaction/entities';
import type {UserId} from '../../src/domain/user/entities';
import {EnvConfigService} from '../../src/infrastructure/config';
import {PrismaService} from '../../src/infrastructure/repository/prisma';
import {XStateRoomMachineFactory} from '../../src/infrastructure/state-machine/xstate';
import {resolveReferences} from './parser';

const prismaBinary = resolve(__dirname, '../../node_modules/.bin/prisma');

export type Variables = {
    ids: {
        user: {[username: string]: UserId};
        company: {[name: string]: CompanyId};
        companyScope: {
            room: {[company: string]: {[number: string]: RoomId}};
            customer: {[company: string]: {[documentId: string]: PersonId}};
            supplier: {[company: string]: {[documentId: string]: PersonId}};
            employee: {[company: string]: {[documentId: string]: PersonId}};
            employeePosition: {[company: string]: {[name: string]: EmployeePositionId}};
            roomCategory: {[company: string]: {[name: string]: RoomCategoryId}};
            transaction: {[company: string]: {[type: string]: {[amount: string]: TransactionId}}};
            reservation: {[company: string]: {[reservationType: string]: {[identifier: string]: ReservationId}}};
            cashier: {[company: string]: {[username: string]: CashierId}};
            defectType: {[company: string]: {[name: string]: DefectTypeId}};
            defect: {[company: string]: {[roomNumber: string]: {[defectTypeName: string]: DefectId}}};
            directSale: {[company: string]: {[sellerName: string]: SaleId}};
            paymentMethod: {[company: string]: {[name: string]: PaymentMethodId}};
            product: {[company: string]: {[code: string]: ProductId}};
            productCategory: {[company: string]: {[name: string]: ProductCategoryId}};
            service: {[company: string]: {[code: string]: ServiceId}};
            serviceCategory: {[company: string]: {[name: string]: ServiceCategoryId}};
            cleaning: {[company: string]: {[roomNumber: string]: RoomStatusId}};
            maintenance: {[company: string]: {[roomNumber: string]: RoomStatusId}};
            inspection: {[company: string]: {[roomNumber: string]: RoomStatusId}};
            blockade: {[company: string]: {[roomNumber: string]: RoomStatusId}};
            deepCleaning: {[company: string]: {[roomNumber: string]: RoomStatusId}};
            account: {[company: string]: {[name: string]: AccountId}};
            audit: {[company: string]: {[roomNumber: string]: RoomStatusId}};
            stock: {[company: string]: {[stockType: string]: {[identifier: string]: StockId}}};
        };
    };
} & JsonObject;

type CompanyScopedIdType = keyof Variables['ids']['companyScope'];
export type VariableIdType = Exclude<keyof Variables['ids'] | CompanyScopedIdType, 'companyScope'>;

const {DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT} = process.env;

export class Context extends World {
    public app!: INestApplication<Express>;

    public variables: Variables = {
        ids: {
            user: {},
            company: {},
            companyScope: {
                room: {},
                customer: {},
                supplier: {},
                employee: {},
                employeePosition: {},
                roomCategory: {},
                transaction: {},
                reservation: {},
                cashier: {},
                defectType: {},
                defect: {},
                directSale: {},
                paymentMethod: {},
                productCategory: {},
                product: {},
                service: {},
                serviceCategory: {},
                cleaning: {},
                maintenance: {},
                inspection: {},
                blockade: {},
                deepCleaning: {},
                account: {},
                audit: {},
                stock: {},
            },
        },
    };

    public clock = new SimulatedClock();

    private database = `test_${randomBytes(4).toString('hex')}`;

    private superagent?: supertest.Agent;

    public get agent(): supertest.Agent {
        if (this.superagent === undefined) {
            this.superagent = supertest.agent(this.app.getHttpServer());
        }

        return this.superagent;
    }

    public get prisma(): PrismaService {
        return this.app.get(PrismaService);
    }

    public async start(): Promise<void> {
        const module = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(Logger)
            .useClass(ConsoleErrorLogger)
            .overrideProvider(PrismaService)
            .useFactory({
                factory: () => {
                    process.env.DATABASE_URL = `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${this.database}`;
                    execSync(`${prismaBinary} migrate deploy`);

                    return new PrismaService();
                },
            })
            .overrideProvider(RoomMachineFactory)
            .useFactory({
                factory: (logger: Logger) => new XStateRoomMachineFactory(logger, this.clock),
                inject: [Logger],
            })
            .compile();

        this.app = module.createNestApplication();

        const configService = this.app.get(EnvConfigService);

        this.app.use(cookieParser(configService.cookieSecret));

        await this.app.init();
    }

    public async stop(): Promise<void> {
        try {
            await this.app.close();

            await this.prisma.$disconnect();

            // Necessary open a connection with another database to drop the test database.
            const manager = new PrismaService({
                datasources: {
                    db: {
                        url: `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/postgres`,
                    },
                },
            });

            await manager.$executeRawUnsafe(`DROP DATABASE "${this.database}"`);
            await manager.$disconnect();
        } catch (error) {
            // eslint-disable-next-line no-console -- Can't do much if the teardown fails
            console.error('Failed to teardown the test environment', error);
        }
    }

    public clearAgent(): void {
        this.superagent = undefined;
    }

    /**
     * Set a variable in the context.
     *
     * Accepts a dot-separated path to set a nested variable.
     *
     * @param path The path to the variable.
     * @param value The value to set.
     */
    public setVariable(path: string, value: Jsonifiable): void {
        const keys = path.split('.');
        let current: Record<string, unknown> = this.variables;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];

            if (!current[key]) {
                current[key] = {};
            }

            current = current[key] as JsonObject;
        }

        current[keys[keys.length - 1]] = value;
    }

    public setVariableId(idType: CompanyScopedIdType, key: Jsonifiable, id: EntityId<string>, company: string): void;

    public setVariableId(
        idType: Exclude<VariableIdType, CompanyScopedIdType>,
        key: Jsonifiable,
        id: EntityId<string>
    ): void;

    public setVariableId(idType: VariableIdType, key: Jsonifiable, id: EntityId<string>, company?: string): void {
        if (company === undefined) {
            this.setVariable(`ids.${idType}.${key}`, id);
        } else {
            this.setVariable(`ids.companyScope.${idType}.${company}.${key}`, id);
        }
    }

    public getVariableId(idType: CompanyScopedIdType, key: Jsonifiable, company: string): EntityId<string>;

    public getVariableId(idType: Exclude<VariableIdType, CompanyScopedIdType>, key: Jsonifiable): EntityId<string>;

    public getVariableId(idType: VariableIdType, keys: string, company?: string): EntityId<string> {
        if (this.isCompanyScopedId(idType)) {
            if (company !== undefined) {
                const id = this.getValueAt(this.variables.ids.companyScope[idType][company], keys);

                if (id === undefined) {
                    throw new Error(`Unknown ${idType} "${keys}" in company "${company}"`);
                }

                return id as EntityId<string>;
            }

            throw new Error(`Company scoped ID "${idType}" requires a company name`);
        } else {
            const id = this.getValueAt(this.variables.ids[idType], keys);

            if (id === undefined) {
                throw new Error(`Unknown ${idType} "${keys}"`);
            }

            return id as EntityId<string>;
        }
    }

    public checkVariableIdType(idType: string): idType is VariableIdType {
        const {companyScope, ...ids} = this.variables.ids;
        const keys = Object.keys({
            ...ids,
            ...companyScope,
        });

        if (!keys.includes(idType)) {
            throw new Error(`Unknown variable ID type "${idType}"`);
        }

        return true;
    }

    /**
     * Check if the JSON object matches the expected pattern.
     *
     * @param data The data to be checked
     * @param expected The pattern to check against
     *
     * @see https://github.com/originate/lodash-match-pattern#match-pattern
     */
    public testMatchPattern(data: JsonObject, expected: string): void {
        chai.expect(data).to.matchPattern(resolveReferences(this, expected));
    }

    private isCompanyScopedId(category: string): category is CompanyScopedIdType {
        return category in this.variables.ids.companyScope;
    }

    private getValueAt(obj: JsonifiableObject, path: string): unknown {
        const keys = path.split('.');
        let current: Record<string, unknown> = obj;

        for (const key of keys) {
            if (current[key] === undefined) {
                return undefined;
            }

            current = current[key] as JsonObject;
        }

        return current;
    }
}

class ConsoleErrorLogger extends Logger {
    public log(log: Log) {
        if (log.level === LogLevel.ERROR) {
            // eslint-disable-next-line no-console -- Help to debug tests
            console.error(log.message, log.details);
        }
    }
}
