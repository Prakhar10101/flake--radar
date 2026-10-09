const fs = require("node:fs");
const { MARKER } = require("./markdown");

async function publish(markdown) {
  const {
    GITHUB_STEP_SUMMARY,
    GITHUB_TOKEN,
    GITHUB_REPOSITORY,
    GITHUB_EVENT_PATH,
    GITHUB_EVENT_NAME,
  } = process.env;

  if (GITHUB_STEP_SUMMARY)
    fs.appendFileSync(GITHUB_STEP_SUMMARY, markdown + "\n");

  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_EVENT_PATH) return;
  if (GITHUB_EVENT_NAME !== "pull_request") return;

  const prNumber = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, "utf8"))
    .pull_request?.number;
  if (!prNumber) return;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "flake-radar",
  };
  const api = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;

  const existing = await (
    await fetch(`${api}/issues/${prNumber}/comments?per_page=100`, { headers })
  ).json();
  const mine = Array.isArray(existing)
    ? existing.find((c) => c.body && c.body.includes(MARKER))
    : null;

  const url = mine
    ? `${api}/issues/comments/${mine.id}`
    : `${api}/issues/${prNumber}/comments`;
  const res = await fetch(url, {
    method: mine ? "PATCH" : "POST",
    headers,
    body: JSON.stringify({ body: markdown }),
  });
  if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
}

module.exports = { publish };
