import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class AiAnalysisPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /análise ia estruturada/i});
        this.subtitle = page.getByText(/snapshot da sessão clínica/i);
    }

    async navigate(patientId: string) {
        await this.page.goto(`/patients/${patientId}/ai-analysis`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+\/ai-analysis$/);
        await expect(this.title).toBeVisible();
    }
}
