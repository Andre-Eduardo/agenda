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

    async sign() {
        await this.page.getByRole('button', {name: 'Assinar evolução', exact: true}).click();
        const confirmation = this.page.getByRole('dialog', {name: 'Confirmar assinatura'});

        await confirmation.getByRole('button', {name: 'Assinar evolução', exact: true}).click();
        await expect(confirmation).toBeHidden();
        await expect(this.page.getByText('Assinada e bloqueada', {exact: true})).toBeVisible();
    }

    async verifyContent(text: string) {
        await expect(this.page.getByText(text)).toBeVisible();
    }

    async backToPatient() {
        await this.patientCard.click();
    }
}
