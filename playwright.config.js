require("dotenv").config();
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "demo-tests",
  testMatch: "**/*.demo.js",
  retries: 1,
  timeout: 15000,
  use: { baseURL: "https://www.saucedemo.com" },
  reporter: [["list"], ["./src/reporter.js"]],
});
