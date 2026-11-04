export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const suppliedKey = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const apiKey = suppliedKey || process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is not configured in environment variables." });
  }

  try {
    const { model, messages, temperature = 0.1, max_tokens = 4096, response_format } = req.body || {};

    const payload = {
      model: model || "openai/gpt-oss-120b",
      messages: messages || [],
      temperature,
      max_tokens: Math.min(Math.max(Number(max_tokens) || 4096, 1), 4096),
    };

    if (response_format) {
      payload.response_format = response_format;
    }

    const upstreamRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const status = upstreamRes.status;
    const data = await upstreamRes.json().catch(() => ({}));

    // Forward upstream rate limit headers if present
    const retryAfter = upstreamRes.headers.get("retry-after");
    if (retryAfter) res.setHeader("retry-after", retryAfter);

    return res.status(status).json(data);
  } catch (error) {
    console.error("[Groq Proxy Error]:", error);
    return res.status(502).json({
      error: "Failed to communicate with Groq API",
      message: error.message
    });
  }
}
