import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class SignInPage extends BasePage {
    readonly pageTitle: Locator;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly submitButton: Locator;
    readonly rememberMeCheckbox: Locator;
    readonly forgotPasswordButton: Locator;
    readonly usernameError: Locator;
    readonly passwordError: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = page.getByRole('heading', {name: /bem-vindo de volta/i});
        this.usernameInput = page.locator('input[name="username"]');
        this.passwordInput = page.locator('input[name="password"]');
        this.submitButton = page.getByRole('button', {name: /^entrar$/i});
        this.rememberMeCheckbox = page.getByRole('checkbox', {name: /manter conectado/i});
        this.forgotPasswordButton = page.getByRole('button', {name: /esqueceu\?/i});
        this.usernameError = page.getByText(/usuário é obrigatório|usuário ou senha incorretos/i);
        this.passwordError = page.getByText(/senha é obrigatória/i);
    }

    async navigate() {
        await this.page.goto('/auth/login');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/auth\/login(\?|$)/);
        await expect(this.pageTitle).toBeVisible();
        await expect(this.usernameInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.submitButton).toBeVisible();
    }

    async signIn(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async verifyInvalidCredentialsError() {
        await expect(this.usernameError).toBeVisible();
        await expect(this.usernameError).toHaveText(/usuário ou senha incorretos/i);
    }

    async verifyRequiredFieldErrors() {
        await expect(this.usernameError).toHaveText(/usuário é obrigatório/i);
        await expect(this.passwordError).toBeVisible();
    }
}
