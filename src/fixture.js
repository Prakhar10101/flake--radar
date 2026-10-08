const base = require("@playwright/test");

const test = base.test.extend({
  page: async ({ page }, use, testInfo) => {
    const network = [];
    const consoleLines = [];

    const baseURL = testInfo.project.use.baseURL;
    const origin = baseURL ? new URL(baseURL).origin : null;
    const sameSite = (url) => !origin || new URL(url).origin === origin;

    page.on("response", (res) => {
      if (res.status() >= 400 && sameSite(res.url())) {
        network.push({
          method: res.request().method(),
          url: res.url(),
          status: res.status(),
        });
      }
    });

    page.on("requestfailed", (req) => {
      if (sameSite(req.url())) {
        network.push({
          method: req.method(),
          url: req.url(),
          status: 0,
          failure: req.failure()?.errorText,
        });
      }
    });

    page.on("console", (msg) =>
      consoleLines.push({ type: msg.type(), text: msg.text() }),
    );
    page.on("pageerror", (err) =>
      consoleLines.push({ type: "pageerror", text: err.message }),
    );

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach("flakeradar-context", {
        body: JSON.stringify({ network, console: consoleLines.slice(-5) }),
        contentType: "application/json",
      });
    }
  },
});

module.exports = { test, expect: base.expect };
