import { expect, type Locator, type Page } from "@playwright/test";

interface FillFormOptions {
  title: string;
  sourceMaterial: string;
}

export class CreatePlanPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly form: Locator;
  readonly titleInput: Locator;
  readonly sourceTextarea: Locator;
  readonly wordCount: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByTestId("create-plan-heading");
    this.form = page.getByTestId("create-plan-form");
    this.titleInput = page.getByTestId("create-plan-title-input");
    this.sourceTextarea = page.getByTestId("create-plan-source-textarea");
    this.wordCount = page.getByTestId("create-plan-word-count");
    this.submitButton = page.getByTestId("create-plan-submit-button");
    this.cancelButton = page.getByTestId("create-plan-cancel-button");
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.form).toBeVisible();
  }

  async fillForm({ title, sourceMaterial }: FillFormOptions) {
    await this.titleInput.fill(title);
    await this.sourceTextarea.fill(sourceMaterial);
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
