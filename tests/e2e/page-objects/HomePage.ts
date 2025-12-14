import { expect, type Locator, type Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly primaryCta: Locator;
  readonly secondaryCta: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.getByRole("heading", { name: /Zastąp ręczne planowanie powtórek/i });
    this.primaryCta = page.getByRole("link", { name: /Załóż darmowe konto/i });
    this.secondaryCta = page.getByRole("link", { name: /Zaloguj się/i });
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectHeroVisible() {
    await expect(this.heroHeading).toBeVisible();
    await expect(this.primaryCta).toBeVisible();
    await expect(this.secondaryCta).toBeVisible();
  }

  async openRegisterCta() {
    await this.primaryCta.click();
  }
}


