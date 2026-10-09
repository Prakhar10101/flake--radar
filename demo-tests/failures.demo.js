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

test("[expect:SELECTOR_ISSUE] getByRole fails to resolve element", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Nonexistent Submit" }),
  ).toBeVisible({ timeout: 2000 });
});

test("[expect:SELECTOR_ISSUE] strict mode violation resolves to multiple elements", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("input").click({ timeout: 2000 });
});

test("[expect:SELECTOR_ISSUE] data-test attribute missing or altered in build", async ({
  page,
}) => {
  await page.goto("/");
  await page.click('[data-test="checkout-shipping-btn"]', { timeout: 2000 });
});

test("[expect:SELECTOR_ISSUE] deeply nested dynamic CSS selector broken", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(
      "div.login_wrapper > div.login_box > form > div.actions > #confirm",
    )
    .click({ timeout: 2000 });
});

test("[expect:BACKEND_ERROR] auth service responds with 500 Internal Server Error", async ({
  page,
}) => {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/auth/login", { method: "POST" }));
  await expect(page.locator(".user-badge")).toBeVisible({ timeout: 2000 });
});

test("[expect:BACKEND_ERROR] payment gateway returns 503 Service Unavailable", async ({
  page,
}) => {
  await page.route("**/api/v1/payments", (route) =>
    route.fulfill({ status: 503, body: "Service Temporarily Unavailable" }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/v1/payments", { method: "POST" }));
  await expect(page.locator("#receipt-id")).toBeVisible({ timeout: 2000 });
});

test("[expect:BACKEND_ERROR] backend reverse proxy returns 504 Gateway Timeout", async ({
  page,
}) => {
  await page.route("**/api/cart/items", (route) =>
    route.fulfill({ status: 504, body: "Gateway Timeout" }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/cart/items", { method: "GET" }));
  await expect(page.locator(".cart-contents")).toBeVisible({ timeout: 2000 });
});

test("[expect:BACKEND_ERROR] server 500 crash causes button not to render", async ({
  page,
}) => {
  await page.route("**/api/user/profile", (route) =>
    route.fulfill({ status: 500, body: "Database down" }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/user/profile"));
  await page.click("#save-profile-btn", { timeout: 2000 });
});

test("[expect:NETWORK_ERROR] socket connection reset mid-flight", async ({
  page,
}) => {
  await page.route("**/api/session", (route) => route.abort("connectionreset"));
  await page.goto("/");
  await page.evaluate(() => fetch("/api/session").catch(() => "failed"));
  await expect(page.locator(".session-active")).toBeVisible({ timeout: 2000 });
});

test("[expect:NETWORK_ERROR] telemetry request blocked by client adblock/firewall", async ({
  page,
}) => {
  await page.route("**/api/telemetry", (route) =>
    route.abort("blockedbyclient"),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/telemetry").catch(() => "blocked"));
  await expect(page.locator(".tracking-verified")).toBeVisible({
    timeout: 2000,
  });
});

test("[expect:NETWORK_ERROR] request dropped due to aborted network stream", async ({
  page,
}) => {
  await page.route("**/api/orders", (route) => route.abort("failed"));
  await page.goto("/");
  await page.evaluate(() => fetch("/api/orders").catch(() => null));
  await page.click("#order-confirmation-badge", { timeout: 2000 });
});

test("[expect:ASSERTION_MISMATCH] element count does not match expected total", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".inventory_item")).toHaveCount(6, {
    timeout: 2000,
  });
});

test("[expect:ASSERTION_MISMATCH] current URL is not destination route", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 2000 });
});

test("[expect:ASSERTION_MISMATCH] input field value does not match state", async ({
  page,
}) => {
  await page.goto("/");
  await page.fill("#user-name", "standard_user");
  await expect(page.locator("#user-name")).toHaveValue("admin_user", {
    timeout: 2000,
  });
});

test("[expect:TIMEOUT] page navigation exceeds step timeout", async ({
  page,
}) => {
  test.setTimeout(2000);
  await page
    .goto("https://www.saucedemo.com", {
      waitUntil: "networkidle",
      timeout: 1900,
    })
    .catch(() => {});
  await page.waitForNavigation({ url: "**/checkout-complete", timeout: 2500 });
});

test("[expect:TIMEOUT] locator action times out waiting for animation state", async ({
  page,
}) => {
  test.setTimeout(2000);
  await page.goto("/");
  await page.waitForFunction(() => false, { timeout: 2500 });
});

test("[expect:FLAKY] DOM render race condition passes on retry", async ({
  page,
}) => {
  await page.goto("/");
  if (test.info().retry === 0) {
    throw new Error(
      "TargetClosedError: element detached from frame during click",
    );
  }
  await expect(page.locator("#login-button")).toBeVisible();
});

test("[expect:FLAKY] transient socket blip passes on retry", async ({
  page,
}) => {
  await page.goto("/");
  if (test.info().retry === 0) {
    throw new Error("net::ERR_CONNECTION_RESET at https://www.saucedemo.com");
  }
  await expect(page.locator("#user-name")).toBeVisible();
});

test("[expect:UNKNOWN] client 404 error should not trigger backend 5xx rule", async ({
  page,
}) => {
  await page.route("**/api/missing-asset", (route) =>
    route.fulfill({ status: 404, body: "Not Found" }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/missing-asset"));
  throw new Error(
    "Application state broken: asset configuration missing on client",
  );
});

test("[expect:ASSERTION_MISMATCH] locator toHaveText timeout mask", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#login-button")).toHaveAttribute(
    "value",
    "SUBMIT_NOW",
    { timeout: 2000 },
  );
});

test("[expect:ASSERTION_MISMATCH] custom currency format assertion mismatch", async ({
  page,
}) => {
  await page.goto("/");
  throw new Error(
    "Discrepancy: Invoice tax split ₹180 does not calculate to 18% of line items",
  );
});

test("[expect:UNKNOWN] unhandled runtime TypeError in application code", async ({
  page,
}) => {
  await page.goto("/");
  throw new TypeError(
    "Cannot read properties of undefined (reading 'stateMachine')",
  );
});

test("[expect:SELECTOR_ISSUE] custom page object model element not found", async ({
  page,
}) => {
  await page.goto("/");
  throw new Error(
    "POM ElementLookupError: Element '#inventory-filter-dropdown' not found in active DOM root",
  );
});

test("[expect:UNKNOWN] client 422 validation error ignored by server-error rule", async ({
  page,
}) => {
  await page.route("**/api/checkout/validate", (route) =>
    route.fulfill({
      status: 422,
      body: JSON.stringify({ error: "Invalid Postal Code" }),
    }),
  );
  await page.goto("/");
  await page.evaluate(() =>
    fetch("/api/checkout/validate", { method: "POST" }),
  );
  throw new Error("Form validation halted unexpectedly");
});
