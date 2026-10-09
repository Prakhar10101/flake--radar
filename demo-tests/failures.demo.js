const { test, expect } = require("../src/fixture");

test("[expect:SELECTOR_ISSUE] click a button that does not exist", async ({
  page,
}) => {
  await page.goto("/");
  await page.click("#checkout-now", { timeout: 2000 });
});

test("[expect:BACKEND_ERROR] checkout API returns 502", async ({ page }) => {
  await page.route("**/api/checkout", (route) =>
    route.fulfill({ status: 502, body: "Bad Gateway" }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/checkout", { method: "POST" }));
  await expect(page.locator(".order-confirmed")).toBeVisible({ timeout: 2000 });
});

test("[expect:NETWORK_ERROR] inventory request is aborted", async ({
  page,
}) => {
  await page.route("**/api/inventory", (route) => route.abort());
  await page.goto("/");
  await page.evaluate(() => fetch("/api/inventory").catch(() => "failed"));
  await expect(page.locator(".inventory-loaded")).toBeVisible({
    timeout: 2000,
  });
});

test("[expect:ASSERTION_MISMATCH] login logo text is wrong", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".login_logo")).toHaveText("Swag Shop", {
    timeout: 2000,
  });
});

test("[expect:TIMEOUT] test is too slow for its time limit", async ({
  page,
}) => {
  test.setTimeout(1500);
  await page.waitForTimeout(5000);
});

test("[expect:FLAKY] fails once, then passes", async ({ page }) => {
  await page.goto("/");
  if (test.info().retry === 0) throw new Error("Simulated random glitch");
});

test("[expect:ASSERTION_MISMATCH] cart total is wrong (custom error)", async ({
  page,
}) => {
  await page.goto("/");
  throw new Error("Cart total mismatch: expected 29.99 but got 0.00");
});
