import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class SignInPage extends BasePage {
    readonly brandTitle: Locator;
    readonly portalTitle: Locator;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly submitButton: Locator;
    readonly forgotPasswordLink: Locator;

    constructor(page: Page) {
        super(page);
        this.brandTitle = page.getByRole('heading', {name: /agenda saúde/i});
        this.portalTitle = page.getByRole('heading', {name: /acesso ao portal clínico/i});
        this.usernameInput = page.getByPlaceholder(/digite seu usuário/i);
        this.passwordInput = page.getByPlaceholder(/sua senha/i);
        this.submitButton = page.getByRole('button', {name: /entrar no sistema/i});
        this.forgotPasswordLink = page.getByRole('link', {name: /esqueceu sua senha/i});
    }

    async navigate() {
        await this.page.goto('/auth/login');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/auth\/login$/);
        await expect(this.brandTitle).toBeVisible();
        await expect(this.portalTitle).toBeVisible();
        await expect(this.usernameInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.submitButton).toBeVisible();
    }

    async signIn(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }
}
