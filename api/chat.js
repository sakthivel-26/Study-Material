export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const openRouterKey = process.env.VITE_OPENROUTER_API_KEY;
    const geminiKey = process.env.VITE_GEMINI_API_KEY;
    const nvidiaKey = process.env.VITE_NVIDIA_API_KEY;

    let completionText = "";

    if (nvidiaKey) {
      const apiRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const result = await apiRes.json();
      completionText = result.choices?.[0]?.message?.content || "";
    } else if (openRouterKey) {
      const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: process.env.VITE_OPENROUTER_MODEL || "google/gemma-2-9b-it:free",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const result = await apiRes.json();
      completionText = result.choices?.[0]?.message?.content || "";
    } else if (geminiKey) {
      const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      });
      const result = await apiRes.json();
      completionText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      return res.status(500).json({ error: "No AI API Key configured" });
    }

    res.status(200).json({ reply: completionText });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
}
