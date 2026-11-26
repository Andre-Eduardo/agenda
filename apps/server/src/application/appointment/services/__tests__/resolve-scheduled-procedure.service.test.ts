import {mock} from 'jest-mock-extended';
import {ResolveScheduledProcedureService} from '@application/appointment/services/resolve-scheduled-procedure.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, InvalidInputException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ProcedurePermission} from '@domain/auth';
import {Authorizer} from '@domain/auth/authorizer';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {Procedure, ProcedureColor, ProcedureId, ProcedureModality} from '@domain/procedure/procedure.entity';
import {ProcedureRepository} from '@domain/procedure/procedure.repository';
import {UserId} from '@domain/user/entities';

describe('ResolveScheduledProcedureService', () => {
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const startAt = new Date('2027-04-01T09:00:00.000Z');
    const defaultEndAt = new Date('2027-04-01T09:35:00.000Z');
    const entry: Procedure = {
        id: ProcedureId.generate(),
        clinicId: actor.clinicId,
        name: 'Evaluation',
        durationMinutes: 35,
        color: ProcedureColor.GREEN,
        priceInCents: 16_500,
        modality: ProcedureModality.REMOTE,
        active: true,
    };
    const repository = mock<ProcedureRepository>();
    const authorizer = mock<Authorizer>();
    const service = new ResolveScheduledProcedureService(repository, authorizer);

    beforeEach(() => {
        repository.findActive.mockResolvedValue(entry);
    });

    it('uses the defaults from the active entry of the current clinic', async () => {
        await expect(service.resolve(actor, {startAt, procedureId: entry.id})).resolves.toEqual({
            endAt: defaultEndAt,
            procedure: {
                id: entry.id.toString(),
                name: entry.name,
                color: entry.color,
                priceInCents: entry.priceInCents,
                modality: entry.modality,
            },
        });
        expect(repository.findActive).toHaveBeenCalledWith(actor.clinicId, entry.id);
        expect(authorizer.validate).not.toHaveBeenCalled();
    });

    it('rejects an unavailable entry', async () => {
        repository.findActive.mockResolvedValue(null);

        await expect(service.resolve(actor, {startAt, procedureId: entry.id})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'procedure.not_found'
        );
    });

    it.each([
        {endAt: new Date('2027-04-01T10:00:00.000Z')},
        {procedureOverrides: {color: ProcedureColor.BLUE}},
        {procedureOverrides: {priceInCents: 0}},
        {procedureOverrides: {modality: ProcedureModality.IN_PERSON}},
    ])('rejects an override when the member lacks permission (%j)', async (override) => {
        authorizer.validate.mockResolvedValue(false);

        await expect(service.resolve(actor, {startAt, procedureId: entry.id, ...override})).rejects.toThrowWithMessage(
            AccessDeniedException,
            'procedure.override_denied'
        );
        expect(authorizer.validate).toHaveBeenCalledWith(
            actor.clinicMemberId,
            actor.userId,
            ProcedurePermission.OVERRIDE
        );
    });

    it('applies authorized overrides to the appointment only', async () => {
        authorizer.validate.mockResolvedValue(true);
        const endAt = new Date('2027-04-01T10:00:00.000Z');

        await expect(
            service.resolve(actor, {startAt, endAt, procedureId: entry.id, procedureOverrides: {priceInCents: 0}})
        ).resolves.toMatchObject({endAt, procedure: {name: entry.name, priceInCents: 0, color: entry.color}});
        expect(entry.priceInCents).toBe(16_500);
    });

    it('rejects a fractional duration override', async () => {
        authorizer.validate.mockResolvedValue(true);

        await expect(
            service.resolve(actor, {startAt, endAt: new Date('2027-04-01T09:35:30.000Z'), procedureId: entry.id})
        ).rejects.toThrowWithMessage(InvalidInputException, 'procedure.invalid_duration');
    });

    it('reschedules an existing snapshot at the same duration even when the catalog item changed', async () => {
        const procedure = {
            id: entry.id.toString(),
            name: 'Original name',
            color: ProcedureColor.RED,
            priceInCents: 100,
            modality: ProcedureModality.IN_PERSON,
        };

        await expect(
            service.resolve(
                actor,
                {startAt: new Date('2027-04-01T10:00:00.000Z'), procedureId: entry.id},
                {
                    startAt,
                    endAt: defaultEndAt,
                    procedure,
                }
            )
        ).resolves.toEqual({endAt: new Date('2027-04-01T10:35:00.000Z'), procedure});
        expect(repository.findActive).not.toHaveBeenCalled();
        expect(authorizer.validate).not.toHaveBeenCalled();
    });

    it('still accepts an explicit end for a booking without a catalog item', async () => {
        await expect(service.resolve(actor, {startAt, endAt: defaultEndAt})).resolves.toEqual({
            endAt: defaultEndAt,
            procedure: null,
        });
    });

    it('rejects a booking without an end time or catalog item', async () => {
        await expect(service.resolve(actor, {startAt})).rejects.toThrowWithMessage(
            InvalidInputException,
            'appointment.end_required'
        );
    });

    it('rejects procedure overrides without a catalog item', async () => {
        await expect(
            service.resolve(actor, {startAt, endAt: defaultEndAt, procedureOverrides: {priceInCents: 0}})
        ).rejects.toThrowWithMessage(InvalidInputException, 'procedure.required');
    });
});
