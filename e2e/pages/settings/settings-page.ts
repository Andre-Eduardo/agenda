import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class SettingsPage extends BasePage {
    readonly title: Locator;

    readonly identityTab: Locator;
    readonly professionalTab: Locator;
    readonly officeTab: Locator;
    readonly securityTab: Locator;

    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly registryNumberInput: Locator;

    readonly saveButton: Locator;

    // Side-nav sections
    readonly agendaSectionButton: Locator;
    readonly salasSectionButton: Locator;

    // Salas section
    readonly roomManagementToggleOn: Locator;
    readonly roomManagementToggleOff: Locator;
    readonly newRoomNameInput: Locator;
    readonly addRoomButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^perfil do profissional$/i});

        this.identityTab = page.getByRole('button', {name: /foto e identidade/i});
        this.professionalTab = page.getByRole('button', {name: /dados profissionais/i});
        this.officeTab = page.getByRole('button', {name: /consultório/i});
        this.securityTab = page.getByRole('button', {name: /segurança e acesso/i});

        this.nameInput = page.getByPlaceholder(/^nome completo$/i);
        this.emailInput = page.getByPlaceholder(/seu@email\.com/i);
        this.registryNumberInput = page.getByPlaceholder(/ex\.: 84321/i);

        this.saveButton = page.getByRole('button', {name: /salvar alterações/i});

        this.agendaSectionButton = page.getByRole('button', {name: /^agenda$/i});
        this.salasSectionButton = page.getByRole('button', {name: /^salas$/i});

        this.roomManagementToggleOn = page.getByRole('radio', {name: /^ativado$/i});
        this.roomManagementToggleOff = page.getByRole('radio', {name: /^desativado$/i});
        this.newRoomNameInput = page.getByPlaceholder(/nome da sala/i);
        this.addRoomButton = page.getByRole('button', {name: /adicionar sala/i});
    }

    async goToAgendaSection() {
        await this.agendaSectionButton.click();
    }

    async goToSalasSection() {
        await this.salasSectionButton.click();
    }

    async enableRoomManagement() {
        await this.roomManagementToggleOn.click();
    }

    async addRoom(name: string) {
        await this.newRoomNameInput.fill(name);
        await this.addRoomButton.click();
    }

    roomRow(name: string): Locator {
        return this.page.getByRole('group', {name});
    }

    async deleteRoom(name: string) {
        await this.roomRow(name)
            .getByRole('button', {name: /remover sala/i})
            .click();
    }

    async navigate() {
        await this.page.goto('/settings');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/settings$/);
        await expect(this.title).toBeVisible();
        await expect(this.identityTab).toBeVisible();
    }

    async updateRegistryNumber(value: string) {
        await this.professionalTab.click();
        await this.registryNumberInput.fill(value);
        // "Salvar alterações" only renders on the last tab ("Segurança e acesso").
        await this.securityTab.click();
        await this.saveButton.click();
    }
}
