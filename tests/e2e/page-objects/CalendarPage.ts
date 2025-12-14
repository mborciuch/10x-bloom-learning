import { expect, type Locator, type Page } from "@playwright/test";

export class CalendarPage {
  readonly page: Page;
  readonly emptyState: Locator;
  readonly emptyStateCreateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emptyState = page.getByTestId("onboarding-empty-state");
    this.emptyStateCreateButton = page.getByTestId("onboarding-create-plan-button");
  }

  async goto() {
    await this.page.goto("/app/calendar");
    await this.page.waitForLoadState("networkidle");
  }

  async expectEmptyStateVisible() {
    await expect(this.emptyState).toBeVisible();
  }

  async startCreatePlanFromEmptyState() {
    await this.emptyStateCreateButton.click();
  }
}


