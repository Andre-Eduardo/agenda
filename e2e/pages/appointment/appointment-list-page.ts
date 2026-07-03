import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class AppointmentListPage extends BasePage {
    readonly title: Locator;
    readonly newAppointmentButton: Locator;

    readonly dayViewButton: Locator;
    readonly weekViewButton: Locator;
    readonly monthViewButton: Locator;

    readonly patientSearchInput: Locator;
    readonly createSubmitButton: Locator;
    readonly createCancelButton: Locator;

    readonly editAppointmentButton: Locator;
    readonly cancelAppointmentButton: Locator;
    readonly confirmCancelButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^agenda$/i});
        this.newAppointmentButton = page.getByRole('button', {name: /novo agendamento/i});

        this.dayViewButton = page.getByRole('button', {name: /^dia$/i});
        this.weekViewButton = page.getByRole('button', {name: /^semana$/i});
        this.monthViewButton = page.getByRole('button', {name: /^mês$/i});

        this.patientSearchInput = page.getByPlaceholder(/buscar paciente/i);
        this.createSubmitButton = page.getByRole('button', {name: /agendar consulta/i});
        this.createCancelButton = page.getByRole('dialog').getByRole('button', {name: /^cancelar$/i});

        this.editAppointmentButton = page.getByRole('button', {name: /^editar$/i});
        this.cancelAppointmentButton = page.getByRole('button', {name: /cancelar consulta/i});
        this.confirmCancelButton = page.getByRole('button', {name: /confirmar cancelamento/i});
    }

    async navigate() {
        await this.page.goto('/appointments');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/appointments$/);
        await expect(this.title).toBeVisible();
        await expect(this.newAppointmentButton).toBeVisible();
    }

    apptBlock(patientName: string): Locator {
        return this.page.getByRole('button', {name: new RegExp(this.escapeRegExp(patientName))});
    }

    async createAppointment(patientName: string) {
        await this.newAppointmentButton.click();
        await this.patientSearchInput.fill(patientName);

        const patientOption = this.page.getByRole('button', {name: patientName});
        await patientOption.click();

        await this.createSubmitButton.click();
    }

    async openAppointment(patientName: string) {
        await this.apptBlock(patientName).click();
    }

    async cancelOpenAppointment() {
        await this.cancelAppointmentButton.click();
        await this.confirmCancelButton.click();
    }
}
