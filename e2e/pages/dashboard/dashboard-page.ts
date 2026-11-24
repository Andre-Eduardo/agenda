import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class DashboardPage extends BasePage {
    readonly pageHeading: Locator;
    readonly todayAppointmentsCard: Locator;
    readonly newAppointmentButton: Locator;
    readonly newPatientButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageHeading = page.getByRole('heading', {name: 'Hoje na clínica'});
        this.todayAppointmentsCard = page.getByText(/consultas hoje/i).first();
        this.newAppointmentButton = page.getByRole('button', {name: /novo agendamento/i}).first();
        this.newPatientButton = page.getByRole('button', {name: /novo paciente/i}).first();
    }

    async navigate() {
        await this.page.goto('/dashboard');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/dashboard$/);
        await expect(this.pageHeading).toBeVisible();
        await expect(this.todayAppointmentsCard).toBeVisible();
    }
}
