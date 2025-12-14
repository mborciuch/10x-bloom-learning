import { expect, type Locator, type Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly primaryCta: Locator;
  readonly secondaryCta: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.getByRole("heading", { name: /Zastąp ręczne planowanie powtórek/i });
    this.primaryCta = page.getByTestId("hero-register-cta");
    this.secondaryCta = page.getByTestId("hero-login-cta");
  }

  async goto() {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  async expectHeroVisible() {
    await expect(this.heroHeading).toBeVisible();
    await expect(this.primaryCta).toBeVisible();
    await expect(this.secondaryCta).toBeVisible();
  }

  async openRegisterCta() {
    await this.primaryCta.click();
  }

  async openLoginCta() {
    await this.secondaryCta.click();
  }
}
