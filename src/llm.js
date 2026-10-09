const { CATEGORIES } = require("./rules");

const SYSTEM = `You triage failed Playwright tests in CI.
Reply with JSON only, no markdown, in this shape:
{"category": "<one of ${CATEGORIES.join(", ")}>", "summary": "<max 25 words>", "suggestion": "<max 20 words>"}`;

async function askLLM(failure, ruleVerdict) {
  const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = process.env;
  if (!LLM_BASE_URL || !LLM_API_KEY || !LLM_MODEL) return null;

  const payload = {
    test: failure.title,
    error: failure.message,
    failedRequests: failure.network.slice(0, 5),
    lastConsoleLines: failure.console,
    ruleBasedGuess: ruleVerdict.category,
  };

  try {
    const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0,
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    if (!CATEGORIES.includes(parsed.category)) parsed.category = "UNKNOWN";
    return parsed;
  } catch {
    return null;
  }
}

module.exports = { askLLM };
