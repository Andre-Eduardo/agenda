import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class PatientListPage extends BasePage {
    readonly title: Locator;
    readonly newPatientButton: Locator;
    readonly searchInput: Locator;
    readonly emptyState: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^pacientes$/i});
        this.newPatientButton = page.getByRole('button', {name: /novo paciente/i});
        this.searchInput = page.getByRole('textbox', {name: /buscar pacientes/i});
        this.emptyState = page.getByText(/nenhum paciente encontrado/i);
    }

    async navigate() {
        await this.page.goto('/patients');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients$/);
        await expect(this.title).toBeVisible();
        await expect(this.newPatientButton).toBeVisible();
    }

    async search(term: string) {
        await this.searchInput.fill(term);
    }

    row(patientName: string): Locator {
        return this.page.getByText(patientName, {exact: true}).first();
    }

    async openPatient(patientName: string) {
        await this.row(patientName).click();
    }

    async goToNewPatient() {
        await this.newPatientButton.click();
    }
}
