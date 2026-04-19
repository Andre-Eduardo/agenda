import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class PatientNewPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^novo paciente$/i});
        this.subtitle = page.getByText(/preencha os dados básicos/i);
    }

    async navigate() {
        await this.page.goto('/patients/new');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/new$/);
        await expect(this.title).toBeVisible();
        await expect(this.subtitle).toBeVisible();
    }
}
