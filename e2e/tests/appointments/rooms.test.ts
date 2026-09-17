import {expect, test} from '@fixtures/test';

test.describe('Room-aware appointments', () => {
    let clinicId: string;

    test.beforeEach(async ({createAuthenticatedProfessional, setClinicRoomManagementEnabled}) => {
        const professional = await createAuthenticatedProfessional();
        clinicId = professional.clinicId;
        await setClinicRoomManagementEnabled(clinicId, true);
    });

    test('should show a room badge on the calendar block for a room-assigned appointment', async ({
        createPatient,
        createRoom,
        appointmentListPage,
    }) => {
        const room = await createRoom({clinicId, name: `Sala ${Date.now()}`});
        const patient = await createPatient({clinicId});

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patient.name, {
            startTime: '10:00',
            durationMin: 60,
            room: room.name,
        });

        await expect(appointmentListPage.apptBlock(patient.name)).toBeVisible();
        await expect(appointmentListPage.roomBadge(room.name)).toBeVisible();
    });

    test('should hard-block double-booking the same room at an overlapping time', async ({
        createPatients,
        createRoom,
        appointmentListPage,
    }) => {
        const room = await createRoom({clinicId, name: `Sala ${Date.now()}`});
        const [patientA, patientB] = await createPatients([{clinicId}, {clinicId}]);

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patientA.name, {
            startTime: '10:00',
            durationMin: 60,
            room: room.name,
        });

        await appointmentListPage.createAppointmentExpectRoomConflict(patientB.name, {
            startTime: '10:30',
            durationMin: 30,
            room: room.name,
        });

        await appointmentListPage.createCancelButton.click();
        await expect(appointmentListPage.apptBlock(patientB.name)).toBeHidden();
    });

    test('should render room columns (and "Sem sala") in the Salas view', async ({
        createPatients,
        createRoom,
        appointmentListPage,
    }) => {
        const roomA = await createRoom({clinicId, name: `Sala A ${Date.now()}`});
        const roomB = await createRoom({clinicId, name: `Sala B ${Date.now()}`});
        const [patientWithRoom, patientWithoutRoom] = await createPatients([{clinicId}, {clinicId}]);

        await appointmentListPage.navigate();
        await appointmentListPage.createAppointment(patientWithRoom.name, {
            startTime: '09:00',
            durationMin: 30,
            room: roomA.name,
        });
        await appointmentListPage.createAppointment(patientWithoutRoom.name, {
            startTime: '11:00',
            durationMin: 30,
        });

        await appointmentListPage.roomsViewButton.click();

        await expect(appointmentListPage.roomColumnHeader(roomA.name)).toBeVisible();
        await expect(appointmentListPage.roomColumnHeader(roomB.name)).toBeVisible();
        await expect(appointmentListPage.noRoomColumnHeader()).toBeVisible();
        await expect(appointmentListPage.apptBlock(patientWithRoom.name)).toBeVisible();
        await expect(appointmentListPage.apptBlock(patientWithoutRoom.name)).toBeVisible();
    });
});
