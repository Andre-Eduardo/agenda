import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class DashboardPage extends BasePage {
    readonly greetingHeading: Locator;
    readonly todayAppointmentsCard: Locator;
    readonly newAppointmentButton: Locator;
    readonly newPatientButton: Locator;

    constructor(page: Page) {
        super(page);
        this.greetingHeading = page.getByText(/bom dia|boa tarde|boa noite/i).first();
        this.todayAppointmentsCard = page.getByText(/consultas hoje/i).first();
        this.newAppointmentButton = page.getByRole('button', {name: /nova consulta/i}).first();
        this.newPatientButton = page.getByRole('button', {name: /novo paciente/i}).first();
    }

    async navigate() {
        await this.page.goto('/');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/$/);
        await expect(this.greetingHeading).toBeVisible();
        await expect(this.todayAppointmentsCard).toBeVisible();
    }
}
