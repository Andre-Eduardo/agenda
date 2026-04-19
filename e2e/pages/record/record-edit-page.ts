import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class RecordEditPage extends BasePage {
    readonly title: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /editar evolução/i});
    }

    async navigate(patientId: string, recordId: string) {
        await this.page.goto(`/patients/${patientId}/records/${recordId}/edit`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+\/records\/[^/]+\/edit$/);
        await expect(this.title).toBeVisible();
    }
}
