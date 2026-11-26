import {Given, Then, When} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

Given(
    'appointment {string} is checked in and announced to room {int}',
    async function (this: Context, key: string, room: number) {
        const appointmentId = this.getVariableId('appointment', key);
        const checkin = await this.agent.patch(`/api/v1/appointments/${appointmentId}/checkin`);

        chai.expect(checkin.status).to.equal(200);
        const announcement = await this.agent
            .post(`/api/v1/patient-call/queue/${appointmentId}/announcements`)
            .send({place: 'ROOM', number: room});

        chai.expect(announcement.status).to.equal(200);
    }
);

When(
    'the check-in for appointment {string} is submitted twice concurrently',
    async function (this: Context, key: string) {
        const appointmentId = this.getVariableId('appointment', key);
        const url = `/api/v1/appointments/${appointmentId}/checkin`;
        const responses = await Promise.all([this.agent.patch(url), this.agent.patch(url)]);

        chai.expect(responses.map((response) => response.status)).to.deep.equal([200, 200]);
        chai.expect(responses.map((response) => response.body.inPatientCallQueue)).to.deep.equal([true, true]);
    }
);

Then('the appointment {string} has a single arrival transition', async function (this: Context, key: string) {
    const appointmentId = this.getVariableId('appointment', key);
    const count = await this.prisma.appointmentStatusTransition.count({where: {appointmentId, toStatus: 'ARRIVED'}});

    chai.expect(count).to.equal(1);
});

When(
    'operators concurrently call appointment {string} to room {int}',
    async function (this: Context, key: string, room: number) {
        const appointmentId = this.getVariableId('appointment', key);
        const url = `/api/v1/patient-call/queue/${appointmentId}/announcements`;
        const body = {place: 'ROOM', number: room};
        const responses = await Promise.all([this.agent.post(url).send(body), this.agent.post(url).send(body)]);

        chai.expect(responses.map((response) => response.status)).to.have.members([200, 409]);
    }
);

Then(
    'appointment {string} has {int} recorded announcement(s)',
    async function (this: Context, key: string, count: number) {
        const appointmentId = this.getVariableId('appointment', key);
        const history = await this.prisma.patientCallAnnouncement.findMany({
            where: {appointmentId},
            orderBy: {visibleFrom: 'asc'},
        });

        chai.expect(history).to.have.length(count);

        for (const [index, call] of history.entries()) {
            chai.expect(call.actorMemberId).to.equal(this.getVariableId('clinicMember', 'dr_house'));
            chai.expect(call.clinicId).to.equal(this.getVariableId('clinic', 'dr_house'));
            chai.expect(call.destination).to.equal('Sala 3');

            if (index > 0)
                chai.expect(call.visibleFrom.toISOString()).to.equal(history[index - 1].expiresAt.toISOString());
        }
    }
);

Then(
    'the public panel displays patient {string} for {string} with only display fields',
    async function (this: Context, patientName: string, destination: string) {
        const response = await this.agent
            .get('/api/v1/patient-call/display')
            .set('x-patient-call-token', this.getVariableId('panel', 'house'));

        chai.expect(response.status).to.equal(200);
        chai.expect(response.headers['cache-control']).to.equal('no-store');
        chai.expect(response.body).to.have.all.keys([
            'title',
            'message',
            'foregroundColor',
            'backgroundColor',
            'soundEnabled',
            'logoUrl',
            'call',
            'recentCalls',
        ]);
        chai.expect(response.body.call).to.have.all.keys(['patientName', 'destination', 'expiresAt']);
        chai.expect(response.body.call).to.include({patientName, destination});
    }
);

When('the announcement for appointment {string} has expired', async function (this: Context, key: string) {
    await this.prisma.patientCallAnnouncement.updateMany({
        where: {appointmentId: this.getVariableId('appointment', key)},
        data: {visibleFrom: new Date(Date.now() - 40_000), expiresAt: new Date(Date.now() - 20_000)},
    });
});

Then('appointment {string} was withdrawn for {string}', async function (this: Context, key: string, reason: string) {
    const entry = await this.prisma.patientCallEntry.findUniqueOrThrow({
        where: {appointmentId: this.getVariableId('appointment', key)},
    });

    chai.expect(entry.closedAt).to.be.instanceOf(Date);
    chai.expect(entry.removalReason).to.equal(reason);
    chai.expect(entry.removedByMemberId).to.equal(this.getVariableId('clinicMember', 'dr_house'));
});

When('I turn the public call history {string}', async function (this: Context, setting: string) {
    const response = await this.agent.put('/api/v1/patient-call/settings').send({
        title: 'Painel de chamada',
        message: 'Dirija-se ao local indicado',
        foregroundColor: '#FFFFFF',
        backgroundColor: '#17324D',
        useClinicLogo: true,
        soundEnabled: false,
        displaySeconds: 15,
        showRecentCalls: setting === 'on',
    });

    chai.expect(response.status).to.equal(200);
    chai.expect(response.body.showRecentCalls).to.equal(setting === 'on');
});

When(
    'the announcement for appointment {string} expired {int} minutes ago',
    async function (this: Context, key: string, minutesAgo: number) {
        const expiresAt = new Date(Date.now() - minutesAgo * 60_000);

        await this.prisma.patientCallAnnouncement.updateMany({
            where: {appointmentId: this.getVariableId('appointment', key)},
            data: {visibleFrom: new Date(expiresAt.getTime() - 15_000), expiresAt},
        });
    }
);

Then('the public panel shows no recent calls', function (this: Context) {
    chai.expect(this.variables.lastResponse).to.have.property('recentCalls').that.deep.equals([]);
});

Then(
    'the public panel lists {string} for {string} as the only recent call',
    function (this: Context, patientName: string, destination: string) {
        chai.expect(this.variables.lastResponse)
            .to.have.property('recentCalls')
            .that.deep.equals([{patientName, destination}]);
    }
);
