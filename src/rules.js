const CATEGORIES = [
  "FLAKY",
  "BACKEND_ERROR",
  "NETWORK_ERROR",
  "SELECTOR_ISSUE",
  "ASSERTION_MISMATCH",
  "TIMEOUT",
  "UNKNOWN",
];

const verdict = (category, reason) => ({ category, reason });

function classify(f) {
  if (f.outcome === "flaky") {
    return verdict("FLAKY", "R1: failed, then passed on retry");
  }

  const server = f.network.find((n) => n.status >= 500);
  if (server) {
    return verdict(
      "BACKEND_ERROR",
      `R2: ${server.method} ${server.url} returned ${server.status}`,
    );
  }

  const failedReq = f.network.find((n) => n.status === 0);
  if (failedReq) {
    return verdict(
      "NETWORK_ERROR",
      `R3: request failed (${failedReq.failure || "unknown"}) ${failedReq.url}`,
    );
  }

  if (/element\(s\) not found|strict mode violation/i.test(f.message)) {
    return verdict(
      "SELECTOR_ISSUE",
      "R4: element could not be found or was ambiguous",
    );
  }

  if (/expect\(.*\)\.\w+/.test(f.message) && /Received/.test(f.message)) {
    return verdict(
      "ASSERTION_MISMATCH",
      "R5: assertion compared expected vs received values",
    );
  }

  if (/waiting for (locator|getBy)/i.test(f.message)) {
    return verdict(
      "SELECTOR_ISSUE",
      "R5b: action timed out waiting for an element",
    );
  }

  if (/timeout.*exceeded/i.test(f.message)) {
    return verdict("TIMEOUT", "R6: timed out with no more specific cause");
  }

  return verdict("UNKNOWN", "No rule matched");
}

module.exports = { classify, CATEGORIES };
