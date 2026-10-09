const fs = require("node:fs");
const path = require("node:path");
const { classify } = require("./rules");
const { redactDeep } = require("./redact");
const { askLLM } = require("./llm");
const { renderMarkdown } = require("./markdown");
const { publish } = require("./github");

const ANSI = /\u001b\[[0-9;]*m/g;

function readContext(attachments = []) {
  const a = attachments.find((x) => x.name === "flakeradar-context" && x.body);
  if (!a) return { network: [], console: [] };
  try {
    const data = JSON.parse(a.body.toString("utf8"));
    return { network: data.network || [], console: data.console || [] };
  } catch {
    return { network: [], console: [] };
  }
}

class FlakeRadarReporter {
  constructor(options = {}) {
    this.useLLM = options.useLLM !== false && !process.env.FLAKE_RADAR_NO_LLM;
    this.tests = new Map();
  }

  onTestEnd(test, result) {
    if (!this.tests.has(test.id))
      this.tests.set(test.id, { test, results: [] });
    this.tests.get(test.id).results.push(result);
  }

  async onEnd() {
    const failures = [];

    for (const { test, results } of this.tests.values()) {
      const outcome = test.outcome();
      if (outcome !== "unexpected" && outcome !== "flaky") continue;

      const badAttempts = results.filter(
        (r) => r.status !== "passed" && r.status !== "skipped",
      );
      const evidence = badAttempts[badAttempts.length - 1];
      if (!evidence) continue;

      const ctx = readContext(evidence.attachments);
      const message = (evidence.error?.message || "No error message")
        .replace(ANSI, "")
        .split("\n")
        .slice(0, 15)
        .join("\n");

      const failure = redactDeep({
        title: test.title,
        file: `${path.relative(process.cwd(), test.location.file)}:${test.location.line}`,
        outcome,
        attempts: results.length,
        message,
        network: ctx.network,
        console: ctx.console,
      });

      let verdict = classify(failure);
      let decidedBy = "rule";
      let summary = "";
      let suggestion = "";

      if (outcome === "flaky") {
        summary = `Failed ${badAttempts.length} time(s), then passed on retry.`;
      } else if (this.useLLM) {
        const ai = await askLLM(failure, verdict);
        if (ai) {
          summary = ai.summary || "";
          suggestion = ai.suggestion || "";
          if (verdict.category === "UNKNOWN" && ai.category !== "UNKNOWN") {
            verdict = {
              category: ai.category,
              reason: "LLM classification (no rule matched)",
            };
            decidedBy = "llm";
          }
        }
      }

      failures.push({ ...failure, ...verdict, decidedBy, summary, suggestion });
    }

    fs.writeFileSync(
      "flake-radar-results.json",
      JSON.stringify(failures, null, 2),
    );
    if (failures.length === 0) return;

    const markdown = renderMarkdown(failures);
    fs.writeFileSync("flake-radar-report.md", markdown);

    try {
      await publish(markdown);
    } catch (err) {
      console.log("[flake-radar] could not post to GitHub:", err.message);
    }
    console.log(
      `\n[flake-radar] analysed ${failures.length} failure(s). See flake-radar-report.md`,
    );
  }
}

module.exports = FlakeRadarReporter;
