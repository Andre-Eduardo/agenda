import {expect, test} from '@fixtures/test';

test.describe('Room management settings', () => {
    test.beforeEach(async ({createAuthenticatedProfessional}) => {
        await createAuthenticatedProfessional();
    });

    test('should enable room management, create a room and delete it', async ({settingsPage}) => {
        const roomName = `Sala ${Date.now()}`;

        await settingsPage.navigate();
        await settingsPage.goToSalasSection();

        await settingsPage.enableRoomManagement();
        await expect(settingsPage.page.getByText('Gerenciamento de salas ativado')).toBeVisible();

        await settingsPage.addRoom(roomName);
        await expect(settingsPage.page.getByText('Sala criada')).toBeVisible();
        await expect(settingsPage.roomRow(roomName)).toBeVisible();

        await settingsPage.deleteRoom(roomName);
        await expect(settingsPage.page.getByText('Sala removida')).toBeVisible();
        await expect(settingsPage.roomRow(roomName)).toBeHidden();
    });
});
