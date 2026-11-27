import {Given, Then} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

const day = () => `${new Date().getUTCFullYear() + 1}-07-01`;

function queueUrl(scope: string) {
    return `/api/v1/attendance?scope=${scope}&dateFrom=${day()}T00:00:00.000Z&dateTo=${day()}T23:59:59.999Z`;
}

/**
 * Creates a patient, books it with the given clinic member next year on 07-01 and checks it in,
 * as the signed-in member.
 *
 * Example:
 *   Given patient "waiting" has arrived for an appointment with "dr_house"
 */
async function book(context: Context, key: string, memberKey: string): Promise<string> {
    const patient = await context.agent
        .post('/api/v1/patients')
        .send({name: `Attendance ${key}`, documentId: '555.666.777-88'});

    chai.expect(patient.status, JSON.stringify(patient.body)).to.equal(201);
    const appointment = await context.agent.post('/api/v1/appointments').send({
        patientId: patient.body.id,
        attendedByMemberId: context.getVariableId('clinicMember', memberKey),
        startAt: `${day()}T11:00:00.000Z`,
        endAt: `${day()}T12:00:00.000Z`,
        type: 'FIRST_VISIT',
    });

    chai.expect(appointment.status, JSON.stringify(appointment.body)).to.equal(201);
    context.setVariableId('appointment', key, appointment.body.id as string);

    return appointment.body.id as string;
}

Given('patient {string} is booked with {string}', async function (this: Context, key: string, memberKey: string) {
    await book(this, key, memberKey);
});

Then('the day list {string} appointment {string}', async function (this: Context, expectation: string, key: string) {
    const response = await this.agent
        .get('/api/v1/appointments')
        .query({dateFrom: `${day()}T00:00:00.000Z`, dateTo: `${day()}T23:59:59.999Z`, limit: 100});

    chai.expect(response.status, JSON.stringify(response.body)).to.equal(200);
    const item = (response.body.data as Array<Record<string, unknown>>).find(
        (entry) => entry.id === this.getVariableId('appointment', key)
    );

    if (expectation === 'hides') {
        chai.expect(item).to.equal(undefined);
    } else {
        chai.expect(item, 'appointment missing from the day list').to.not.equal(undefined);
        chai.expect(item?.patientName).to.equal(`Attendance ${key}`);
    }
});

Then('checking in appointment {string} responds {int}', async function (this: Context, key: string, status: number) {
    const response = await this.agent.patch(`/api/v1/appointments/${this.getVariableId('appointment', key)}/checkin`);

    chai.expect(response.status, JSON.stringify(response.body)).to.equal(status);
});

Given(
    'patient {string} has arrived for an appointment with {string}',
    async function (this: Context, key: string, memberKey: string) {
        const patient = await this.agent
            .post('/api/v1/patients')
            .send({name: `Attendance ${key}`, documentId: '111.222.333-44'});

        chai.expect(patient.status, JSON.stringify(patient.body)).to.equal(201);
        const appointment = await this.agent.post('/api/v1/appointments').send({
            patientId: patient.body.id,
            attendedByMemberId: this.getVariableId('clinicMember', memberKey),
            startAt: `${day()}T09:00:00.000Z`,
            endAt: `${day()}T10:00:00.000Z`,
            type: 'FIRST_VISIT',
        });

        chai.expect(appointment.status, JSON.stringify(appointment.body)).to.equal(201);
        this.setVariableId('appointment', key, appointment.body.id as string);
        const checkin = await this.agent.patch(`/api/v1/appointments/${appointment.body.id}/checkin`);

        chai.expect(checkin.status).to.equal(200);
    }
);

Given('the agenda of {string} is granted to {string}', async function (this: Context, owner: string, grantee: string) {
    const response = await this.agent
        .post(`/api/v1/members/${this.getVariableId('clinicMember', owner)}/agenda-access`)
        .send({granteeMemberId: this.getVariableId('clinicMember', grantee)});

    chai.expect(response.status, JSON.stringify(response.body)).to.equal(201);
});

Given('the clinic {string} requires triage', async function (this: Context, clinicKey: string) {
    const response = await this.agent
        .patch(`/api/v1/clinics/${this.getVariableId('clinic', clinicKey)}`)
        .send({triageRequired: true});

    chai.expect(response.status, JSON.stringify(response.body)).to.equal(200);
    chai.expect(response.body.triageRequired).to.equal(true);
});

Then(
    'calling appointment {string} to {string} responds {int}',
    async function (this: Context, key: string, destination: string, status: number) {
        const response = await this.agent
            .post(`/api/v1/attendance/${this.getVariableId('appointment', key)}/calls`)
            .send({destination});

        chai.expect(response.status, JSON.stringify(response.body)).to.equal(status);
        this.variables.lastResponse = response.body;
    }
);

Then('finishing appointment {string} responds {int}', async function (this: Context, key: string, status: number) {
    const response = await this.agent.post(`/api/v1/attendance/${this.getVariableId('appointment', key)}/finish`);

    chai.expect(response.status, JSON.stringify(response.body)).to.equal(status);

    if (status === 200) chai.expect(response.body.status).to.equal('COMPLETED');
});

Then(
    'the legacy call of appointment {string} responds {int}',
    async function (this: Context, key: string, status: number) {
        const response = await this.agent.patch(`/api/v1/appointments/${this.getVariableId('appointment', key)}/call`);

        chai.expect(response.status, JSON.stringify(response.body)).to.equal(status);
    }
);

Then(
    'saving the triage of appointment {string} with weight {string} and release {string} responds {int}',
    async function (this: Context, key: string, weight: string, release: string, status: number) {
        const response = await this.agent
            .put(`/api/v1/attendance/${this.getVariableId('appointment', key)}/triage`)
            .send({weightKg: weight === 'none' ? null : Number(weight), release: release === 'yes'});

        chai.expect(response.status, JSON.stringify(response.body)).to.equal(status);

        if (status === 200) {
            chai.expect(response.body.released).to.equal(release === 'yes');
            chai.expect(response.body.weightKg).to.equal(weight === 'none' ? null : Number(weight));
        }
    }
);

Then('the last call was {string} on the TV', function (this: Context, announced: string) {
    chai.expect(this.variables.lastResponse).to.containSubset({
        status: 'IN_PROGRESS',
        announced: announced === 'shown',
    });
});

Then(
    'the {string} attendance queue lists appointment {string} with:',
    async function (this: Context, scope: string, key: string, table: {rowsHash(): Record<string, string>}) {
        const response = await this.agent.get(queueUrl(scope));

        chai.expect(response.status, JSON.stringify(response.body)).to.equal(200);
        const item = (response.body.items as Array<Record<string, unknown>>).find(
            (entry) => entry.appointmentId === this.getVariableId('appointment', key)
        );

        chai.expect(item, 'appointment missing from the queue').to.not.equal(undefined);

        for (const [field, value] of Object.entries(table.rowsHash())) {
            chai.expect(String(item?.[field]), field).to.equal(value);
        }
    }
);

Then('the {string} attendance queue is empty', async function (this: Context, scope: string) {
    const response = await this.agent.get(queueUrl(scope));

    chai.expect(response.status).to.equal(200);
    chai.expect(response.body.items).to.deep.equal([]);
});
