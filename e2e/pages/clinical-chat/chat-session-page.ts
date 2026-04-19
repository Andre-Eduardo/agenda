import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class ChatSessionPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly messageInput: Locator;
    readonly sendButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /chat clínico ia/i});
        this.subtitle = page.getByText(/assistente para análise clínica/i);
        this.messageInput = page.getByPlaceholder(/digite sua pergunta/i);
        this.sendButton = page.getByRole('button', {name: /enviar/i});
    }

    async navigate(patientId: string) {
        await this.page.goto(`/patients/${patientId}/chat`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+\/chat$/);
        await expect(this.title).toBeVisible();
    }
}
