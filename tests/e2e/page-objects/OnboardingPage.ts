/**
 * @jest-environment jsdom
 */
import { expect, type Locator, type Page } from "@playwright/test";

export class OnboardingPage {
  readonly page: Page;
  readonly emptyState: Locator;
  readonly createPlanButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emptyState = page.getByTestId("onboarding-empty-state");
    this.createPlanButton = page.getByTestId("onboarding-create-plan-button");
  }

  async expectVisible() {
    await expect(this.emptyState).toBeVisible();
    await expect(this.createPlanButton).toBeVisible();
  }

  async startFirstPlanCreation() {
    await this.createPlanButton.click();
  }
}
