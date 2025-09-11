import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {DefectTypeChangedEvent, DefectTypeCreatedEvent, DefectTypeDeletedEvent} from '../../events';
import type {CreateDefectType} from '../defect-type.entity';
import {DefectType, DefectTypeId} from '../defect-type.entity';
import {fakeDefectType} from './fake-defect-type';

describe('A defect type', () => {
    const companyId = CompanyId.generate();
    const now = new Date(1000);

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a defect-type-created event', () => {
            const data: CreateDefectType = {
                companyId,
                name: 'defect type 1',
            };

            const defectType = DefectType.create(data);

            expect(defectType.id).toBeInstanceOf(DefectTypeId);
            expect(defectType.name).toBe(data.name);
            expect(defectType.companyId).toBe(companyId);

            expect(defectType.events).toEqual([
                {
                    type: DefectTypeCreatedEvent.type,
                    companyId,
                    defectType,
                    timestamp: now,
                },
            ]);
            expect(defectType.events[0]).toBeInstanceOf(DefectTypeCreatedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const data: CreateDefectType = {
                companyId,
                name: '',
            };

            expect(() => DefectType.create(data)).toThrowWithMessage(
                InvalidInputException,
                'Defect type name must be at least 1 character long.'
            );
        });
    });

    describe('on change', () => {
        it('should emit a defect-type-changed event', () => {
            const defectType = fakeDefectType({companyId});

            const oldDefectType = fakeDefectType(defectType);

            defectType.change({
                name: 'defect type 2',
            });

            expect(defectType.name).toBe('defect type 2');

            expect(defectType.events).toEqual([
                {
                    type: DefectTypeChangedEvent.type,
                    timestamp: now,
                    companyId,
                    oldState: oldDefectType,
                    newState: defectType,
                },
            ]);

            expect(defectType.events[0]).toBeInstanceOf(DefectTypeChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const defectType = fakeDefectType();

            expect(() =>
                defectType.change({
                    name: '',
                })
            ).toThrowWithMessage(InvalidInputException, 'Defect type name must be at least 1 character long.');
        });
    });

    describe('on deletion', () => {
        it('should emit a defect-type-deleted event', () => {
            const defectType = fakeDefectType({
                companyId,
            });

            defectType.delete();

            expect(defectType.events).toEqual([
                {
                    type: DefectTypeDeletedEvent.type,
                    timestamp: now,
                    companyId,
                    defectType,
                },
            ]);

            expect(defectType.events[0]).toBeInstanceOf(DefectTypeDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const defectType = fakeDefectType({
            companyId,
            name: 'defect type 1',
        });

        expect(defectType.toJSON()).toEqual({
            id: defectType.id.toString(),
            companyId: companyId.toJSON(),
            name: 'defect type 1',
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });
});

describe('A defect type ID', () => {
    it('can be created from a string', () => {
        const uuid = '0c64d1cb-764d-44eb-bb3a-973a854dd449';
        const id = DefectTypeId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(DefectTypeId.generate()).toBeInstanceOf(DefectTypeId);
    });
});
