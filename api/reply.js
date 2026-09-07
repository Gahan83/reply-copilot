// Vercel serverless function — POST /api/reply
// Calls Azure OpenAI (Responses API) server-side. The browser never sees the key.
//
// Set in Vercel → Project → Settings → Environment Variables:
//   AZURE_OPENAI_ENDPOINT    full Target URI from the portal, incl. ?api-version=...
//                            e.g. https://emi-ts-shared-we-oai.openai.azure.com/openai/responses?api-version=2025-03-01-preview
//   AZURE_OPENAI_KEY         the key from the portal
//   AZURE_OPENAI_DEPLOYMENT  deployment name, e.g. gpt-5.4-mini

const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5.4-mini";

function buildPrompt({ tone, voice, from, rel, incoming }) {
  const toneLine = {
    me: "Mirror the user's own voice as shown in their sample messages below. Match their length, punctuation, capitalisation, emoji habits and idioms exactly.",
    warm: "Warm, friendly, human. Natural idioms. Not gushy.",
    brief: "Short and blunt. One or two lines max. No fluff.",
    formal: "Polite and professional, but not stiff.",
    idiom: "Lean on everyday idioms and colloquial turns of phrase. Keep them natural and common — no forced or dated expressions.",
  }[tone] || "Warm, friendly, human.";

  const system = `You draft WhatsApp replies on behalf of a user. You never send — you only propose one reply for the user to approve.

Rules:
- Output ONLY the reply text. No preamble, no quotes, no options, no explanation.
- Keep it concise and human. Sound like a real person texting, not a customer-service bot.
- ${toneLine}
- Match the register to the relationship with the sender.
- If the message needs info you can't know (a date, a yes/no only the user can decide), leave a natural placeholder in [square brackets] rather than inventing facts.

${voice ? `The user's own past messages, for voice matching:\n"""\n${voice}\n"""` : ""}`;

  const userMsg = `Incoming WhatsApp message.
From: ${from || "unknown"}${rel ? ` (${rel})` : ""}
Message: "${incoming}"

Draft my reply.`;

  return { system, userMsg };
}

function extractText(data) {
  // Responses API convenience field first.
  if (data && typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }
  // Fall back to walking the output array.
  if (data && Array.isArray(data.output)) {
    return data.output
      .filter((o) => o.type === "message")
      .flatMap((o) => o.content || [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text)
      .join("\n")
      .trim();
  }
  return "";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;
  if (!endpoint || !key) {
    res.status(500).json({ error: "AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_KEY not configured on the server." });
    return;
  }

  let input = req.body;
  if (typeof input === "string") {
    try { input = JSON.parse(input); } catch { input = {}; }
  }
  input = input || {};

  const incoming = (input.incoming || "").trim();
  if (!incoming) {
    res.status(400).json({ error: "Paste an incoming message first." });
    return;
  }

  const { system, userMsg } = buildPrompt({
    tone: input.tone,
    voice: (input.voice || "").trim(),
    from: (input.from || "").trim(),
    rel: (input.rel || "").trim(),
    incoming,
  });

  try {
    const apiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": key,
      },
      body: JSON.stringify({
        model: DEPLOYMENT,
        instructions: system,
        input: userMsg,
        max_output_tokens: 1000,
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      const msg = (data && data.error && (data.error.message || data.error.code)) || "Upstream model error.";
      res.status(apiRes.status).json({ error: msg });
      return;
    }

    const reply = extractText(data);
    if (!reply) {
      res.status(502).json({ error: "Model returned no text." });
      return;
    }

    res.status(200).json({ reply });
  } catch (e) {
    res.status(502).json({ error: "Couldn't reach the model. Try again." });
  }
};
