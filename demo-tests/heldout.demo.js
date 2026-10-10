const { test, expect } = require("../src/fixture");

test("[expect:SELECTOR_ISSUE] waitForSelector times out on missing modal", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForSelector("#newsletter-subscription-modal", {
    timeout: 2000,
  });
});

test("[expect:SELECTOR_ISSUE] page.fill fails on non-existent input field", async ({
  page,
}) => {
  await page.goto("/");
  await page.fill("#discount-code-input", "PROMO100", { timeout: 2000 });
});

test("[expect:ASSERTION_MISMATCH] toContainText fails partial substring match", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".login_logo")).toContainText(
    "Sauce Enterprise Portal",
    { timeout: 2000 },
  );
});

test("[expect:ASSERTION_MISMATCH] toBeDisabled fails on enabled interactable button", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#login-button")).toBeDisabled({ timeout: 2000 });
});

test("[expect:BACKEND_ERROR] upstream proxy 502 bad gateway during checkout", async ({
  page,
}) => {
  await page.route("**/api/checkout", (route) =>
    route.fulfill({ status: 502, body: "Bad Gateway from upstream Envoy" }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/checkout", { method: "POST" }));
  await expect(page.locator(".order-badge")).toBeVisible({ timeout: 2000 });
});

test("[expect:NETWORK_ERROR] socket connection dropped abruptly mid-request", async ({
  page,
}) => {
  await page.route("**/api/analytics", (route) =>
    route.abort("connectionreset"),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/analytics").catch(() => "dropped"));
  await expect(page.locator(".analytics-live")).toBeVisible({ timeout: 2000 });
});

test("[expect:TIMEOUT] page.waitForResponse hangs indefinitely", async ({
  page,
}) => {
  test.setTimeout(2000);
  await page.goto("/");
  await page.waitForResponse("**/api/never-called-endpoint", { timeout: 2500 });
});

test("[expect:FLAKY] transient locator timeout passes on retry", async ({
  page,
}) => {
  await page.goto("/");
  if (test.info().retry === 0) {
    throw new Error(
      "Timeout 2000ms exceeded waiting for locator('#login-button')",
    );
  }
  await expect(page.locator("#login-button")).toBeVisible();
});

test("[expect:BACKEND_ERROR] server crash masked by frontend console spam", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    fetch("/api/health", { method: "GET" }).catch(() => {});
    for (let i = 0; i < 10; i++)
      console.error(`Unrelated component log trace event #${i}`);
  });
  throw new Error(
    "Validation check: Expected payload confirmation to match 'OK'",
  );
});

test("[expect:ASSERTION_MISMATCH] assertion message discussing network protocol strings", async ({
  page,
}) => {
  await page.goto("/");
  throw new Error(
    "Assertion mismatch: Expected UI error toast 'net::ERR_CONNECTION_REFUSED' but received 'Please try again later'",
  );
});

test("[expect:BACKEND_ERROR] 503 response leading to missing locator timeout", async ({
  page,
}) => {
  await page.route("**/api/user/details", (route) =>
    route.fulfill({ status: 503, body: "Service Unavailable" }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/user/details"));
  await page.click("#save-profile-btn", { timeout: 2000 });
});

test("[expect:UNKNOWN] target page crashed abruptly during session", async ({
  page,
}) => {
  await page.goto("/");
  throw new Error(
    "TargetPage.close: Target closed. Browser context destroyed during frame transition",
  );
});

test("[expect:ASSERTION_MISMATCH] business timeout syntax thrown as validation mismatch", async ({
  page,
}) => {
  await page.goto("/");
  throw new Error(
    "Timeout 30000ms exceeded waiting for account balance to reconcile with ledger entries",
  );
});

test("[expect:UNKNOWN] client 401 unauthorized session expiry", async ({
  page,
}) => {
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 401,
      body: JSON.stringify({ error: "Session expired" }),
    }),
  );
  await page.goto("/");
  await page.evaluate(() => fetch("/api/me"));
  throw new Error("Authentication state revoked: redirected to login gate");
});

test("[expect:SELECTOR_ISSUE] ambiguous multi-element state with expected-received terminology", async ({
  page,
}) => {
  await page.goto("/");
  throw new Error(
    "Error finding element: Expected unique node for selector '.action-btn', but received 4 matching elements in DOM tree",
  );
});
