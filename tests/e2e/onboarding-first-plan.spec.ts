import { expect, test } from "@playwright/test";
import { HomePage } from "./page-objects/HomePage";
import { LoginPage } from "./page-objects/LoginPage";
import { CalendarPage } from "./page-objects/CalendarPage";
import { CreatePlanPage } from "./page-objects/CreatePlanPage";
import { getE2EUser } from "./support/e2eUser";

const emptyPaginatedResponse = {
  items: [],
  page: 1,
  pageSize: 50,
  total: 0,
};

test.describe("First plan onboarding flow", () => {
  test("user logs in, sees onboarding, and opens create plan form", async ({ page }) => {
    const user = getE2EUser();
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);
    const calendarPage = new CalendarPage(page);
    const createPlanPage = new CreatePlanPage(page);

    await page.route("**/api/auth/signin", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ redirectTo: "/app/calendar" }),
      });
    });

    await page.route("**/api/study-plans*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(emptyPaginatedResponse),
      });
    });

    await page.route("**/api/review-sessions**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(emptyPaginatedResponse),
      });
    });

    await homePage.goto();
    await homePage.expectHeroVisible();

    await homePage.openLoginCta();
    await expect(page).toHaveURL(/\/login$/);

    await loginPage.expectLoaded();
  });
});
