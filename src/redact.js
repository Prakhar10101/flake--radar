const PATTERNS = [
  [/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[JWT]"],
  [/Bearer\s+[\w.\-~+/]+=*/gi, "Bearer [TOKEN]"],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[EMAIL]"],
  [
    /(password|passwd|pwd|token|secret|api[_-]?key)(["']?\s*[:=]\s*["']?)[^\s"',&]+/gi,
    "$1$2[REDACTED]",
  ],
  [/\b[a-f0-9]{32,}\b/gi, "[HEX]"],
];

function redact(text) {
  let out = String(text);
  for (const [pattern, replacement] of PATTERNS)
    out = out.replace(pattern, replacement);
  return out;
}

function redactDeep(value) {
  if (typeof value === "string") return redact(value);
  if (Array.isArray(value)) return value.map(redactDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, redactDeep(v)]),
    );
  }
  return value;
}

module.exports = { redact, redactDeep };
