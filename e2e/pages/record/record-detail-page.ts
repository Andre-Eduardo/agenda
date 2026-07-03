import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class RecordDetailPage extends BasePage {
    readonly eyebrow: Locator;
    readonly soapSectionTitle: Locator;
    readonly patientCard: Locator;

    constructor(page: Page) {
        super(page);
        this.eyebrow = page.getByText(/^evolução clínica$/i);
        this.soapSectionTitle = page.getByText(/evolução clínica \(soap\)/i);
        this.patientCard = page.locator('.pat-card');
    }

    async navigate(patientId: string, recordId: string) {
        await this.page.goto(`/patients/${patientId}/records/${recordId}`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+\/records\/[^/]+$/);
        await expect(this.eyebrow).toBeVisible();
        await expect(this.soapSectionTitle).toBeVisible();
    }

    async verifyContent(text: string) {
        await expect(this.page.getByText(text)).toBeVisible();
    }

    async backToPatient() {
        await this.patientCard.click();
    }
}
