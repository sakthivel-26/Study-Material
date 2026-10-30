export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-requested-with");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured in environment variables." });
  }

  // GET: list available models
  if (req.method === "GET") {
    try {
      const upstreamRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        method: "GET",
        headers: {
          "x-goog-api-key": apiKey,
        },
      });
      const data = await upstreamRes.json().catch(() => ({}));
      return res.status(upstreamRes.status).json(data);
    } catch (error) {
      return res.status(502).json({ error: "Failed to fetch Gemini models", message: error.message });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { model = "gemini-2.0-flash", contents, generationConfig } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: "No contents provided in request body" });
    }

    const cleanModel = model.replace(/^models\//, "");
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`;

    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: generationConfig || { temperature: 0.1 },
      }),
    });

    const status = upstreamRes.status;
    const data = await upstreamRes.json().catch(() => ({}));

    // Forward retry-after if Google sends it
    const retryAfter = upstreamRes.headers.get("retry-after");
    if (retryAfter) res.setHeader("retry-after", retryAfter);

    return res.status(status).json(data);
  } catch (error) {
    console.error("[Gemini Proxy Error]:", error);
    return res.status(502).json({
      error: "Failed to communicate with Gemini API",
      message: error.message,
    });
  }
}
