import { expect, type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submitButton: Locator;
  readonly togglePasswordButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.rememberCheckbox = page.getByTestId("login-remember-checkbox");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password-link");
    this.submitButton = page.getByTestId("login-submit-button");
    this.togglePasswordButton = page.getByTestId("login-toggle-password-visibility");
    this.errorAlert = page.getByTestId("login-error-alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string, options?: { remember?: boolean }) {
    await this.emailInput.fill("");
    await this.emailInput.fill(email);
    await expect(this.emailInput).toHaveValue(email);

    await this.passwordInput.fill("");
    await this.passwordInput.fill(password);
    await expect(this.passwordInput).toHaveValue(password);

    if (typeof options?.remember === "boolean") {
      const isChecked = await this.rememberCheckbox.isChecked();
      if (isChecked !== options.remember) {
        await this.rememberCheckbox.click();
      }
    }

    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async togglePasswordVisibility() {
    await this.togglePasswordButton.click();
  }

  async expectLoaded() {
    await expect(this.form).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async expectError(message?: string | RegExp) {
    await expect(this.errorAlert).toBeVisible();
    if (message) {
      await expect(this.errorAlert).toContainText(message);
    }
  }

  async navigateToForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}
