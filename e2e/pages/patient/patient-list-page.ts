import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class PatientListPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly newPatientButton: Locator;
    readonly searchInput: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^pacientes$/i});
        this.subtitle = page.getByText(/gestão de pacientes/i);
        this.newPatientButton = page.getByRole('button', {name: /novo paciente/i});
        this.searchInput = page.getByPlaceholder(/buscar por nome ou cpf/i);
    }

    async navigate() {
        await this.page.goto('/patients');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients$/);
        await expect(this.title).toBeVisible();
        await expect(this.newPatientButton).toBeVisible();
    }
}
