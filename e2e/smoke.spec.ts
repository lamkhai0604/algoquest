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

  await expect(page.getByRole("heading", { name: "Learning Path" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Learning Path" })).toBeVisible();

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
  await expect(page.getByRole("heading", { name: "Learning Path" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/level-map-phone.png` });
});

test("player reads the lesson, solves a problem, and earns XP", async ({
  page,
}) => {
  await page.goto(`${API}/test-login?email=learner@example.com`);
  await expect(
    page.getByRole("heading", { name: "Level 1 · Big-O & Algorithm Basics" }),
  ).toBeVisible();
  await expect(page.getByTitle("Total XP")).toContainText("0");
  await expect(page.getByTitle("Hints left")).toContainText("3");

  // Lesson in five steps: text, visualizer with a prediction, quick check.
  await page.getByRole("link", { name: "Read lesson" }).click();
  await expect(
    page.getByRole("heading", { name: "Lesson: Big-O & Algorithm Basics" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Intuition" })).toBeVisible();
  await page.getByRole("tab", { name: "Step 2: Visualize" }).click();
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(page.getByText("Step 2 of 6")).toBeVisible();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.getByRole("button", { name: "Next step" }).click();
  await expect(
    page.getByText("Answer the question to see what happens in this step."),
  ).toBeVisible();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByText("Correct.")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/visualizer.png`, fullPage: true });
  await page.getByRole("tab", { name: "Step 4: Check" }).click();
  await page
    .getByRole("button", { name: "O(n²)", exact: true })
    .first()
    .click();
  await expect(page.getByText("Correct.")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/lesson.png`, fullPage: true });

  // Problem list: Hard problems are placeholders.
  await page.getByRole("tab", { name: "Step 5: Practice" }).click();
  await page.getByRole("link", { name: "Go to the problems" }).click();
  await expect(
    page.getByRole("heading", { name: "Problems", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Coming soon").first()).toBeVisible();
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
  // One hint: 20 XP becomes 16, and the header shows 2 hints left.
  await page
    .getByRole("button", { name: "Show hint 1 of 3 (−20% XP)" })
    .click();
  await expect(page.getByText("Hint 1.")).toBeVisible();
  await expect(page.getByTitle("Hints left")).toContainText("2");
  await expect(page.getByText("Up to 16 XP")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/solve.png`, fullPage: true });
  await submit.click();
  await expect(page.getByText("Solved", { exact: true })).toBeVisible();
  await expect(page.getByText("+16 XP")).toBeVisible();
  await expect(page.getByTitle("Total XP")).toContainText("16");
  await page.screenshot({ path: `${SHOTS}/feedback.png`, fullPage: true });

  // Code for 2x XP: real JavaScript in a real Web Worker (FR-07, D-035).
  await page.getByRole("button", { name: "Write code" }).click();
  await page
    .getByLabel("Your JavaScript code")
    .fill(
      "function maxTemperature(temps) {\n  if (temps.length === 0) return null;\n  let best = temps[0];\n  for (const t of temps) if (t > best) best = t;\n  return best;\n}",
    );
  await page.getByRole("button", { name: "▶ Run tests" }).click();
  await expect(page.getByText(/tests passed/)).toContainText(
    /(\d+) \/ \1 tests passed/,
  );
  await expect(page.getByText("+16 XP · 2× XP earned")).toBeVisible();
  await expect(page.getByTitle("Total XP")).toContainText("32");
  await page.screenshot({ path: `${SHOTS}/code-passed.png`, fullPage: true });

  // A graded problem reopens on its result; Retry asks first (D-042).
  await page.getByRole("link", { name: /Back to the problems/ }).click();
  await page.getByRole("link", { name: /Max Temperature/ }).click();
  await expect(page.getByText("Solved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Retry/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Retry this problem?" }),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/retry-dialog.png` });
  await page.getByRole("button", { name: "Keep my result" }).click();

  // The next problem (Easy, order 2) opened when this one was solved.
  await page.getByRole("link", { name: /Next problem/ }).click();
  await expect(
    page.getByRole("heading", { name: "Count Passing Scores" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "How your answer is scored" }),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/next-problem.png`, fullPage: true });

  // The level map now shows the XP and the solved problem.
  await page.getByRole("link", { name: "AlgoQuest" }).click();
  await expect(page.getByText("1 of 6 problems solved.")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/level-map-progress.png` });
});
