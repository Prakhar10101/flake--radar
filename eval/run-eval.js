const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const mode = process.argv[2] === "rules" ? "rules" : "hybrid";
const env = { ...process.env };
if (mode === "rules") {
  env.FLAKE_RADAR_NO_LLM = "1";
} else {
  delete env.FLAKE_RADAR_NO_LLM;
  env.LLM_ONLY_UNKNOWN = "1";
  env.LLM_MAX_CALLS = "200";
  env.LLM_OMIT_TITLE = "1";
}

spawnSync("npx playwright test", { stdio: "inherit", shell: true, env });

const results = JSON.parse(fs.readFileSync("flake-radar-results.json", "utf8"));

const dir = "demo-tests";
const labelled = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".demo.js"))
  .flatMap((f) => [
    ...fs.readFileSync(path.join(dir, f), "utf8").matchAll(/\[expect:(\w+)\]/g),
  ]).length;

const pct = (a, b) => (b ? `${a}/${b} (${Math.round((a / b) * 100)}%)` : "n/a");

let ruleRight = 0,
  ruleTotal = 0;
let trapRight = 0,
  trapTotal = 0;
let hardRight = 0,
  hardTotal = 0;

console.log("\n--- EVAL RESULTS ---");
for (const r of results) {
  const expected = (r.title.match(/\[expect:(\w+)\]/) || [])[1];
  if (!expected) continue;

  const abstained = r.category === "UNKNOWN" || r.decidedBy === "llm";
  let group, ok;

  if (expected === "UNKNOWN") {
    group = "TRAP";
    ok = abstained;
    trapTotal++;
    if (ok) trapRight++;
  } else if (abstained) {
    group = "HARD";
    ok = r.category === expected;
    hardTotal++;
    if (ok) hardRight++;
  } else {
    group = "RULE";
    ok = r.category === expected;
    ruleTotal++;
    if (ok) ruleRight++;
  }

  console.log(
    `${ok ? "PASS" : "FAIL"} [${group}] expected ${expected.padEnd(18)} got ${r.category.padEnd(18)} (${r.decidedBy})  ${r.title}`,
  );
}

console.log(`\nMode: ${mode}`);
console.log(
  `Decided by rules, correct:           ${pct(ruleRight, ruleTotal)}`,
);
console.log(
  `Trap tests, rules correctly abstained: ${pct(trapRight, trapTotal)}`,
);
console.log(
  `Hard cases (rules abstained):        ${pct(hardRight, hardTotal)}`,
);
console.log(
  `Overall, excluding trap tests:       ${pct(ruleRight + hardRight, ruleTotal + hardTotal)}`,
);
if (results.length < labelled) {
  console.log(
    `Note: ${labelled - results.length} labelled test(s) did not fail, so they were not analysed.`,
  );
}
