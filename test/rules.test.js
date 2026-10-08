const { test } = require("node:test");
const assert = require("node:assert");
const { classify } = require("../src/rules");

const base = { outcome: "unexpected", message: "", network: [], console: [] };

test("flaky outcome wins", () => {
  assert.equal(classify({ ...base, outcome: "flaky" }).category, "FLAKY");
});

test("5xx response is a backend error", () => {
  const f = {
    ...base,
    network: [{ method: "POST", url: "/api/x", status: 502 }],
  };
  assert.equal(classify(f).category, "BACKEND_ERROR");
});

test("5xx beats a missing element", () => {
  const f = {
    ...base,
    message: "element(s) not found",
    network: [{ method: "GET", url: "/api/x", status: 500 }],
  };
  assert.equal(classify(f).category, "BACKEND_ERROR");
});

test("missing locator is a selector issue", () => {
  const f = {
    ...base,
    message: "Timeout 2000ms exceeded.\n - waiting for locator('#nope')",
  };
  assert.equal(classify(f).category, "SELECTOR_ISSUE");
});

test("unmatched error is UNKNOWN", () => {
  assert.equal(
    classify({ ...base, message: "something odd" }).category,
    "UNKNOWN",
  );
});
