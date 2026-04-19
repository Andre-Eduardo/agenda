import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class RecordNewPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /nova evolução clínica/i});
        this.subtitle = page.getByText(/formato soap/i);
    }

    async navigate(patientId: string) {
        await this.page.goto(`/patients/${patientId}/records/new`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+\/records\/new$/);
        await expect(this.title).toBeVisible();
    }
}
