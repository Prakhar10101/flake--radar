const { test } = require("node:test");
const assert = require("node:assert");
const { redact } = require("../src/redact");

test("removes emails and bearer tokens", () => {
  const out = redact("a@b.com sent Authorization: Bearer abc.def.ghi");
  assert.ok(!out.includes("a@b.com"));
  assert.ok(!out.includes("abc.def.ghi"));
});

test("removes password values", () => {
  assert.ok(!redact("password=hunter2").includes("hunter2"));
});
