import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class PatientEditPage extends BasePage {
    readonly title: Locator;
    readonly documentSubtitle: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^editar:/i});
        this.documentSubtitle = page.getByText(/documento:/i).first();
    }

    async navigate(patientId: string) {
        await this.page.goto(`/patients/${patientId}/edit`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+\/edit$/);
        await expect(this.title).toBeVisible();
        await expect(this.documentSubtitle).toBeVisible();
    }
}
