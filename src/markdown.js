const MARKER = "<!-- flake-radar -->";
const FENCE = "```";

const ICONS = {
  FLAKY: "🎲",
  BACKEND_ERROR: "🔥",
  NETWORK_ERROR: "📡",
  SELECTOR_ISSUE: "🎯",
  ASSERTION_MISMATCH: "⚖️",
  TIMEOUT: "⏱️",
  UNKNOWN: "❓",
};

const LABELS = {
  FLAKY: "Flaky",
  BACKEND_ERROR: "Backend error",
  NETWORK_ERROR: "Network error",
  SELECTOR_ISSUE: "Selector issue",
  ASSERTION_MISMATCH: "Assertion mismatch",
  TIMEOUT: "Timeout",
  UNKNOWN: "Unknown",
};

const esc = (s) =>
  String(s || "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
const clean = (title) => title.replace(/^\[expect:\w+\]\s*/, "");

function renderMarkdown(failures) {
  const counts = {};
  for (const f of failures) counts[f.category] = (counts[f.category] || 0) + 1;

  const chips = Object.entries(counts)
    .map(([c, n]) => `${ICONS[c] || "❓"} ${LABELS[c] || c} **${n}**`)
    .join(" &nbsp;·&nbsp; ");

  const rows = failures
    .map((f) => {
      const fix = f.suggestion ? `<br>💡 ${esc(f.suggestion)}` : "";
      return `| ${esc(clean(f.title))}<br><sub>${esc(f.file)}</sub> | ${ICONS[f.category] || "❓"} **${LABELS[f.category] || f.category}** | ${esc(f.summary || f.reason)}${fix} |`;
    })
    .join("\n");

  const details = failures
    .map((f) => {
      const reqs = f.network.length
        ? "**Failed requests:**\n" +
          f.network
            .map(
              (n) =>
                `- \`${n.method} ${n.url}\` → ${n.status || n.failure || "failed"}`,
            )
            .join("\n") +
          "\n\n"
        : "";
      return `<details>
<summary>${ICONS[f.category] || "❓"} ${esc(clean(f.title))}</summary>

**Rule fired:** ${f.reason}

${reqs}${FENCE}
${f.message}
${FENCE}

</details>`;
    })
    .join("\n\n");

  return `${MARKER}
## 📡 FlakeRadar report

**${failures.length} failing test(s) analysed**

${chips}

| Test | Verdict | What happened |
|---|---|---|
${rows}

### Details

${details}
`;
}

module.exports = { renderMarkdown, MARKER };
