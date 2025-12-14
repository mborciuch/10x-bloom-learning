import { expect, test } from "@playwright/test";
import { HomePage } from "./page-objects/HomePage";

test.describe("Landing page experience", () => {
  test("shows hero content for visitors", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.expectHeroVisible();
    await expect(page.getByRole("link", { name: /Zobacz jak działa Bloom Learning/i })).toBeVisible();
  });

  test("navigates to registration from the primary CTA", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.openRegisterCta();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: /Rozpocznij naukę z Bloom Learning/i })).toBeVisible();
  });
});


