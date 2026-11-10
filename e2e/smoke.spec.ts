import { expect, test } from "@playwright/test";

const API = process.env.API_URL ?? "http://localhost:8080";
const SHOTS = "results/screenshots";

test("sign-in page in dark and light themes", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Sign in to AlgoQuest" }),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/sign-in-dark.png` });

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.screenshot({ path: `${SHOTS}/sign-in-light.png` });
});

test("owner signs in, sees the level map, reaches admin, signs out", async ({
  page,
}) => {
  await page.goto(`${API}/test-login?email=owner@example.com`);

  await expect(page.getByRole("heading", { name: "Your quest" })).toBeVisible();
  await expect(page.getByText("Smoke Tester")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/level-map.png` });

  const token = await page.evaluate(() => {
    const raw = window.sessionStorage.getItem("algoquest.session");
    return raw ? (JSON.parse(raw) as { token: string }).token : "";
  });
  const admin = await page.request.get(`${API}/api/v1/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(admin.status()).toBe(200);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to AlgoQuest" }),
  ).toBeVisible();
});

test("player gets 403 on admin endpoints", async ({ page }) => {
  await page.goto(`${API}/test-login?email=player@example.com`);
  await expect(page.getByRole("heading", { name: "Your quest" })).toBeVisible();

  const token = await page.evaluate(() => {
    const raw = window.sessionStorage.getItem("algoquest.session");
    return raw ? (JSON.parse(raw) as { token: string }).token : "";
  });
  const admin = await page.request.get(`${API}/api/v1/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(admin.status()).toBe(403);
});

test("level map on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${API}/test-login?email=player@example.com`);
  await expect(page.getByRole("heading", { name: "Your quest" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/level-map-phone.png` });
});

test("player reads the lesson, solves a problem, and earns XP", async ({
  page,
}) => {
  await page.goto(`${API}/test-login?email=learner@example.com`);
  await expect(
    page.getByRole("heading", { name: "Level 1 · Big-O & Basics" }),
  ).toBeVisible();
  await expect(page.getByTitle("Total XP")).toContainText("0");

  // Lesson: text, walkthrough, quick check.
  await page.getByRole("link", { name: "Read lesson" }).click();
  await expect(
    page.getByRole("heading", { name: "Lesson: Big-O & Basics" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByText("Step 2 of 6")).toBeVisible();
  await page.getByRole("button", { name: "O(n²)", exact: true }).first().click();
  await expect(page.getByText("Correct.")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/lesson.png`, fullPage: true });

  // Problem list: Hard problems are placeholders.
  await page.getByRole("link", { name: "Go to the problems" }).click();
  await expect(
    page.getByRole("heading", { name: "Problems", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Coming in a later version").first(),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/level.png`, fullPage: true });

  // Solve: a grader failure keeps the text and records nothing.
  await page.getByRole("link", { name: /Max Temperature/ }).click();
  const box = page.getByLabel("Your explanation");
  const submit = page.getByRole("button", { name: "Submit for grading" });
  await box.fill("GRADER-DOWN");
  await submit.click();
  await expect(page.getByRole("alert")).toContainText(
    "Grading is unavailable, try again later.",
  );
  await expect(box).toHaveValue("GRADER-DOWN");

  await box.fill(
    "If the array is empty I return null. Otherwise I keep the largest value " +
      "seen so far while walking through the array once. O(n) time, O(1) space.",
  );
  await page.screenshot({ path: `${SHOTS}/solve.png`, fullPage: true });
  await submit.click();
  await expect(page.getByText("Solved", { exact: true })).toBeVisible();
  await expect(page.getByText("+25 XP")).toBeVisible();
  await expect(page.getByTitle("Total XP")).toContainText("25");
  await page.screenshot({ path: `${SHOTS}/feedback.png`, fullPage: true });

  // The level map now shows the XP and the solved problem.
  await page.getByRole("link", { name: "AlgoQuest" }).click();
  await expect(page.getByText("1 of 6 problems solved.")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/level-map-progress.png` });
});
