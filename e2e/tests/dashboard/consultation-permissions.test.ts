import {expect, test} from '@fixtures/test';
import {login} from '@lib/auth';
import {createTestAppointment, createTestRecord} from '@lib/factories';
import {uuidv7} from 'uuidv7';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

test('shows the dashboard visit summary without exposing another professional’s evolution', async ({
    page,
    db,
    createProfessional,
    createClinicMember,
    createPatient,
}) => {
    const author = await createProfessional();
    const {clinicId} = author;
    const colleague = await createClinicMember({clinicId, role: 'PROFESSIONAL'});
    const secretary = await createClinicMember({clinicId, role: 'SECRETARY'});
    const manager = await createClinicMember({clinicId, role: 'ADMIN'});
    const superadmin = await createClinicMember({
        clinicId,
        role: 'VIEWER',
        user: {globalRole: 'SUPER_ADMIN'},
    });
    const outside = await createProfessional();
    const patient = await createPatient({
        clinicId,
        grantAccessTo: [author.clinicMemberId, colleague.id, secretary.id],
    });
    const appointment = await createTestAppointment({
        clinicId,
        patientId: patient.id,
        memberId: author.clinicMemberId,
        startAt: new Date(),
    });
    await db.appointment.update({
        where: {id: appointment.id},
        data: {note: 'Anotação privada do agendamento'},
    });
    const clinical = await createTestRecord({
        clinicId,
        patientId: patient.id,
        memberId: author.clinicMemberId,
        professionalId: author.id,
        title: 'Evolução clínica privada',
        subjective: 'O paciente relatou um sintoma.',
    });
    const now = new Date();
    await db.documentPermission.create({
        data: {
            id: uuidv7(),
            clinicId,
            memberId: colleague.id,
            entityType: 'RECORD',
            entityId: clinical.id,
            canView: true,
            createdAt: now,
            updatedAt: now,
        },
    });
    const recordUrl = `${API_URL}/api/v1/records/${clinical.id}`;
    const recordsUrl = `${API_URL}/api/v1/records?limit=10`;
    const operationalUrl = `${API_URL}/api/v1/appointments/operational?limit=10`;

    await login(page, secretary.user);
    await page.goto('/dashboard');
    await expect(page.getByText('Consultas de hoje', {exact: true})).toBeVisible();
    await expect(page.getByText(patient.name, {exact: true})).toBeVisible();
    await expect(page.getByText('Retorno', {exact: true})).toBeVisible();
    await expect(page.getByText('Atividade recente', {exact: true})).toHaveCount(0);
    const operations = await page.request.get(operationalUrl);
    expect(operations.ok()).toBe(true);
    expect(await operations.json()).toEqual({
        totalCount: 1,
        data: [
            {
                id: appointment.id,
                patientId: patient.id,
                startAt: appointment.startAt.toISOString(),
                endAt: appointment.endAt.toISOString(),
                status: 'SCHEDULED',
                type: 'RETURN',
            },
        ],
    });
    expect((await page.request.get(recordUrl)).status()).toBe(403);

    for (const member of [colleague, manager, outside]) {
        await login(page, member.user);
        const list = await page.request.get(recordsUrl);
        expect(list.ok()).toBe(true);
        expect(await list.json()).toEqual({data: [], totalCount: 0});
        expect((await page.request.get(recordUrl)).status()).toBe(403);
    }
    const otherClinic = await page.request.get(operationalUrl);
    expect(otherClinic.ok()).toBe(true);
    expect(await otherClinic.json()).toEqual({data: [], totalCount: 0});

    for (const member of [author, superadmin]) {
        await login(page, member.user);
        const list = await page.request.get(recordsUrl);
        expect(list.ok()).toBe(true);
        expect(await list.json()).toMatchObject({totalCount: 1, data: [{id: clinical.id}]});
        const detail = await page.request.get(recordUrl);
        expect(detail.ok()).toBe(true);
        expect(await detail.json()).toMatchObject({id: clinical.id, subjective: clinical.subjective});
    }
});
