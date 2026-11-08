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
