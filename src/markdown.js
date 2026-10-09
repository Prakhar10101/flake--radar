const MARKER = "<!-- flake-radar -->";

const esc = (s) =>
  String(s || "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");

function renderMarkdown(failures) {
  const rows = failures
    .map((f) => {
      const note = [f.summary, f.suggestion ? `**Fix:** ${f.suggestion}` : ""]
        .filter(Boolean)
        .join(" ");
      return `| ${esc(f.title)} | **${f.category}** | ${esc(f.reason)} | ${esc(note)} |`;
    })
    .join("\n");

  return `${MARKER}
## 🔎 FlakeRadar report

${failures.length} failing test(s) analysed.

| Test | Category | Why | Summary |
|---|---|---|---|
${rows}
`;
}

module.exports = { renderMarkdown, MARKER };
