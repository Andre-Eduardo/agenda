import type {CallHandler, ExecutionContext, HttpArgumentsHost} from '@nestjs/common';
import type {Request, Response} from 'express';
import {mock} from 'jest-mock-extended';
import {lastValueFrom, of, throwError} from 'rxjs';
import {AuditHttpInterceptor} from '@application/audit/audit-http.interceptor';
import {Actor, unknownActor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {AuditLogRepository} from '@domain/audit/audit-log.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {UserId} from '@domain/user/entities';

class PatientController {
    getPatient() {}
}

function setup(actor: Request['actor']) {
    const repository = mock<AuditLogRepository>();

    repository.append.mockResolvedValue();
    const request = mock<Request>({actor, method: 'GET', params: {id: 'patient-1'}});
    const response = mock<Response>({statusCode: 200});
    const http = mock<HttpArgumentsHost>();

    http.getRequest.mockReturnValue(request);
    http.getResponse.mockReturnValue(response);
    const context = mock<ExecutionContext>();

    context.switchToHttp.mockReturnValue(http);
    context.getClass.mockReturnValue(PatientController);
    context.getHandler.mockReturnValue(PatientController.prototype.getPatient);

    return {repository, context, interceptor: new AuditHttpInterceptor(repository)};
}

describe('the HTTP audit interceptor', () => {
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };

    it('persists a successful clinical read with actor, clinic, resource, action and result', async () => {
        const {repository, context, interceptor} = setup(actor);
        const next = mock<CallHandler>({handle: () => of({id: 'patient-1'})});

        await expect(lastValueFrom(interceptor.intercept(context, next))).resolves.toEqual({id: 'patient-1'});
        expect(repository.append).toHaveBeenCalledWith({
            clinicId: actor.clinicId.toString(),
            actorUserId: actor.userId.toString(),
            actorMemberId: actor.clinicMemberId.toString(),
            resource: 'PatientController',
            resourceId: 'patient-1',
            action: 'GET:getPatient',
            result: 'SUCCESS',
            statusCode: 200,
            ip: '127.0.0.1',
        });
    });

    it('persists a denied clinical access without disclosing payloads', async () => {
        const {repository, context, interceptor} = setup(actor);
        const error = new AccessDeniedException('denied', AccessDeniedReason.NOT_ALLOWED);
        const next = mock<CallHandler>({handle: () => throwError(() => error)});

        await expect(lastValueFrom(interceptor.intercept(context, next))).rejects.toBe(error);
        expect(repository.append).toHaveBeenCalledWith(
            expect.objectContaining({result: 'DENIED', statusCode: 403, resourceId: 'patient-1'})
        );
    });

    it('does not create an unscoped entry for a public request', async () => {
        const {repository, context, interceptor} = setup(unknownActor);
        const next = mock<CallHandler>({handle: () => of('ok')});

        await expect(lastValueFrom(interceptor.intercept(context, next))).resolves.toBe('ok');
        expect(repository.append).not.toHaveBeenCalled();
    });

    it('fails the request when its audit entry cannot be persisted', async () => {
        const {repository, context, interceptor} = setup(actor);

        repository.append.mockRejectedValue(new Error('audit unavailable'));
        const next = mock<CallHandler>({handle: () => of({id: 'patient-1'})});

        await expect(lastValueFrom(interceptor.intercept(context, next))).rejects.toThrow('audit unavailable');
    });
});
